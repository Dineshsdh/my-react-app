import express from 'express';
import { body, validationResult } from 'express-validator';
import { query, run, get } from '../config/database.js';

const router = express.Router();

// Validation middleware
const validateInvoice = [
  body('invoice_number').trim().isLength({ min: 1 }).withMessage('Invoice number is required'),
  body('customer_id').optional().isInt({ min: 1 }),
  body('invoice_date').isISO8601().withMessage('Valid invoice date is required'),
  body('due_date').optional().isISO8601(),
  body('subtotal').isFloat({ min: 0 }).withMessage('Subtotal must be a positive number'),
  body('cgst_rate').optional().isFloat({ min: 0, max: 100 }),
  body('sgst_rate').optional().isFloat({ min: 0, max: 100 }),
  body('cgst_amount').isFloat({ min: 0 }).withMessage('CGST amount must be a positive number'),
  body('sgst_amount').isFloat({ min: 0 }).withMessage('SGST amount must be a positive number'),
  body('total_tax').isFloat({ min: 0 }).withMessage('Total tax must be a positive number'),
  body('round_off').optional().isFloat(),
  body('grand_total').isFloat({ min: 0 }).withMessage('Grand total must be a positive number'),
  body('amount_in_words').optional().trim(),
  body('status').optional().isIn(['draft', 'sent', 'paid', 'cancelled']),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.description').trim().isLength({ min: 1 }).withMessage('Item description is required'),
  body('items.*.quantity').isFloat({ min: 0.01 }).withMessage('Item quantity must be greater than 0'),
  body('items.*.rate').isFloat({ min: 0 }).withMessage('Item rate must be a positive number'),
  body('items.*.amount').isFloat({ min: 0 }).withMessage('Item amount must be a positive number')
];

// Get all invoices
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, customer_id, date_from, date_to } = req.query;
    const offset = (page - 1) * limit;
    
    let sql = `
      SELECT i.*, c.name as customer_name, c.gstin as customer_gstin
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      WHERE 1=1
    `;
    let params = [];
    
    if (status) {
      sql += ' AND i.status = ?';
      params.push(status);
    }
    
    if (customer_id) {
      sql += ' AND i.customer_id = ?';
      params.push(customer_id);
    }
    
    if (date_from) {
      sql += ' AND i.invoice_date >= ?';
      params.push(date_from);
    }
    
    if (date_to) {
      sql += ' AND i.invoice_date <= ?';
      params.push(date_to);
    }
    
    sql += ' ORDER BY i.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const invoices = await query(sql, params);
    
    // Get total count for pagination
    let countSql = 'SELECT COUNT(*) as total FROM invoices i WHERE 1=1';
    let countParams = [];
    
    if (status) {
      countSql += ' AND i.status = ?';
      countParams.push(status);
    }
    if (customer_id) {
      countSql += ' AND i.customer_id = ?';
      countParams.push(customer_id);
    }
    if (date_from) {
      countSql += ' AND i.invoice_date >= ?';
      countParams.push(date_from);
    }
    if (date_to) {
      countSql += ' AND i.invoice_date <= ?';
      countParams.push(date_to);
    }
    
    const [{ total }] = await query(countSql, countParams);
    
    res.json({
      invoices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// Get invoice by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get invoice with customer details
    const invoice = await get(`
      SELECT i.*, c.name as customer_name, c.address as customer_address,
             c.gstin as customer_gstin, c.state as customer_state, c.state_code as customer_state_code
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      WHERE i.id = ?
    `, [id]);
    
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    // Get invoice items
    const items = await query(`
      SELECT * FROM invoice_items 
      WHERE invoice_id = ? 
      ORDER BY id
    `, [id]);
    
    res.json({ ...invoice, items });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
});

// Create new invoice
router.post('/', validateInvoice, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const {
      invoice_number, customer_id, invoice_date, due_date,
      subtotal, cgst_rate, sgst_rate, cgst_amount, sgst_amount,
      total_tax, round_off, grand_total, amount_in_words, status, items
    } = req.body;
    
    // Create invoice
    const invoiceResult = await run(`
      INSERT INTO invoices (
        invoice_number, customer_id, invoice_date, due_date,
        subtotal, cgst_rate, sgst_rate, cgst_amount, sgst_amount,
        total_tax, round_off, grand_total, amount_in_words, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      invoice_number, customer_id, invoice_date, due_date,
      subtotal, cgst_rate || 9.0, sgst_rate || 9.0, cgst_amount, sgst_amount,
      total_tax, round_off || 0.0, grand_total, amount_in_words, status || 'draft'
    ]);
    
    const invoiceId = invoiceResult.id;
    
    // Create invoice items
    for (const item of items) {
      await run(`
        INSERT INTO invoice_items (
          invoice_id, description, weight, hsn_code, quantity, rate, amount
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        invoiceId, item.description, item.weight, item.hsn_code,
        item.quantity, item.rate, item.amount
      ]);
    }
    
    // Get the complete invoice with items
    const invoice = await get(`
      SELECT i.*, c.name as customer_name
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      WHERE i.id = ?
    `, [invoiceId]);
    
    const invoiceItems = await query(`
      SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY id
    `, [invoiceId]);
    
    res.status(201).json({ ...invoice, items: invoiceItems });
  } catch (error) {
    console.error('Error creating invoice:', error);
    if (error.code === 'SQLITE_CONSTRAINT') {
      res.status(409).json({ error: 'Invoice number already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create invoice' });
    }
  }
});

// Update invoice
router.put('/:id', validateInvoice, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { id } = req.params;
    const {
      invoice_number, customer_id, invoice_date, due_date,
      subtotal, cgst_rate, sgst_rate, cgst_amount, sgst_amount,
      total_tax, round_off, grand_total, amount_in_words, status, items
    } = req.body;
    
    // Update invoice
    const result = await run(`
      UPDATE invoices SET
        invoice_number = ?, customer_id = ?, invoice_date = ?, due_date = ?,
        subtotal = ?, cgst_rate = ?, sgst_rate = ?, cgst_amount = ?, sgst_amount = ?,
        total_tax = ?, round_off = ?, grand_total = ?, amount_in_words = ?, status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      invoice_number, customer_id, invoice_date, due_date,
      subtotal, cgst_rate, sgst_rate, cgst_amount, sgst_amount,
      total_tax, round_off, grand_total, amount_in_words, status, id
    ]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    // Delete existing items and create new ones
    await run('DELETE FROM invoice_items WHERE invoice_id = ?', [id]);
    
    for (const item of items) {
      await run(`
        INSERT INTO invoice_items (
          invoice_id, description, weight, hsn_code, quantity, rate, amount
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        id, item.description, item.weight, item.hsn_code,
        item.quantity, item.rate, item.amount
      ]);
    }
    
    // Get updated invoice
    const invoice = await get(`
      SELECT i.*, c.name as customer_name
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      WHERE i.id = ?
    `, [id]);
    
    const invoiceItems = await query(`
      SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY id
    `, [id]);
    
    res.json({ ...invoice, items: invoiceItems });
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ error: 'Failed to update invoice' });
  }
});

// Delete invoice
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await run('DELETE FROM invoices WHERE id = ?', [id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
});

// Get next invoice number
router.get('/next/number', async (req, res) => {
  try {
    const result = await get(`
      SELECT invoice_number FROM invoices 
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    
    let nextNumber = 1;
    if (result && result.invoice_number) {
      const match = result.invoice_number.match(/(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }
    
    const prefix = 'INV-';
    const paddedNumber = nextNumber.toString().padStart(4, '0');
    
    res.json({ next_invoice_number: `${prefix}${paddedNumber}` });
  } catch (error) {
    console.error('Error getting next invoice number:', error);
    res.status(500).json({ error: 'Failed to generate invoice number' });
  }
});

export default router;