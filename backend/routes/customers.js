import express from 'express';
import { body, validationResult } from 'express-validator';
import { query, run, get } from '../config/database.js';

const router = express.Router();

// Validation middleware
const validateCustomer = [
  body('name').trim().isLength({ min: 1 }).withMessage('Name is required'),
  body('address').optional().trim(),
  body('gstin').optional().trim().isLength({ max: 15 }),
  body('state').optional().trim(),
  body('state_code').optional().trim().isLength({ max: 2 }),
  body('phone').optional().trim().isMobilePhone(),
  body('email').optional().trim().isEmail()
];

// Get all customers
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;
    
    let sql = 'SELECT * FROM customers';
    let params = [];
    
    if (search) {
      sql += ' WHERE name LIKE ? OR gstin LIKE ? OR phone LIKE ?';
      params = [`%${search}%`, `%${search}%`, `%${search}%`];
    }
    
    sql += ' ORDER BY name ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const customers = await query(sql, params);
    
    // Get total count for pagination
    let countSql = 'SELECT COUNT(*) as total FROM customers';
    let countParams = [];
    
    if (search) {
      countSql += ' WHERE name LIKE ? OR gstin LIKE ? OR phone LIKE ?';
      countParams = [`%${search}%`, `%${search}%`, `%${search}%`];
    }
    
    const [{ total }] = await query(countSql, countParams);
    
    res.json({
      customers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Get customer by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await get('SELECT * FROM customers WHERE id = ?', [id]);
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// Create new customer
router.post('/', validateCustomer, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { name, address, gstin, state, state_code, phone, email } = req.body;
    
    const result = await run(
      `INSERT INTO customers (name, address, gstin, state, state_code, phone, email)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, address, gstin, state, state_code, phone, email]
    );
    
    const customer = await get('SELECT * FROM customers WHERE id = ?', [result.id]);
    res.status(201).json(customer);
  } catch (error) {
    console.error('Error creating customer:', error);
    if (error.code === 'SQLITE_CONSTRAINT') {
      res.status(409).json({ error: 'Customer with this GSTIN already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create customer' });
    }
  }
});

// Update customer
router.put('/:id', validateCustomer, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { id } = req.params;
    const { name, address, gstin, state, state_code, phone, email } = req.body;
    
    const result = await run(
      `UPDATE customers 
       SET name = ?, address = ?, gstin = ?, state = ?, state_code = ?, phone = ?, email = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, address, gstin, state, state_code, phone, email, id]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    const customer = await get('SELECT * FROM customers WHERE id = ?', [id]);
    res.json(customer);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// Delete customer
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if customer has any invoices
    const invoices = await query('SELECT COUNT(*) as count FROM invoices WHERE customer_id = ?', [id]);
    if (invoices[0].count > 0) {
      return res.status(409).json({ 
        error: 'Cannot delete customer with existing invoices' 
      });
    }
    
    const result = await run('DELETE FROM customers WHERE id = ?', [id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

// Search customers (for autocomplete)
router.get('/search/:term', async (req, res) => {
  try {
    const { term } = req.params;
    const customers = await query(
      'SELECT id, name, gstin, state FROM customers WHERE name LIKE ? OR gstin LIKE ? LIMIT 10',
      [`%${term}%`, `%${term}%`]
    );
    
    res.json(customers);
  } catch (error) {
    console.error('Error searching customers:', error);
    res.status(500).json({ error: 'Failed to search customers' });
  }
});

export default router;