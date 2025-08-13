import express from 'express';
import { body, validationResult } from 'express-validator';
import { query, run, get } from '../config/database.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, JPG, PNG, GIF) are allowed!'));
    }
  }
});

// Validation middleware
const validateCompany = [
  body('company_name').trim().isLength({ min: 1 }).withMessage('Company name is required'),
  body('address').optional().trim(),
  body('gstin').optional().trim().isLength({ max: 15 }),
  body('state').optional().trim(),
  body('state_code').optional().trim().isLength({ max: 2 }),
  body('phone').optional().trim(),
  body('email').optional().trim().isEmail()
];

// Get company settings
router.get('/', async (req, res) => {
  try {
    const company = await get('SELECT * FROM company_settings WHERE id = 1');
    
    if (!company) {
      // Return default company settings if none exist
      const defaultCompany = {
        id: 1,
        company_name: process.env.DEFAULT_COMPANY_NAME || 'Your Company Name',
        address: '',
        gstin: process.env.DEFAULT_GSTIN || '',
        state: process.env.DEFAULT_STATE || '',
        state_code: process.env.DEFAULT_STATE_CODE || '',
        phone: '',
        email: '',
        logo_path: null,
        signature_path: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      return res.json(defaultCompany);
    }
    
    res.json(company);
  } catch (error) {
    console.error('Error fetching company settings:', error);
    res.status(500).json({ error: 'Failed to fetch company settings' });
  }
});

// Update company settings
router.put('/', validateCompany, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { company_name, address, gstin, state, state_code, phone, email } = req.body;
    
    // Check if company settings exist
    const existing = await get('SELECT * FROM company_settings WHERE id = 1');
    
    if (existing) {
      // Update existing settings
      await run(`
        UPDATE company_settings SET
          company_name = ?, address = ?, gstin = ?, state = ?, state_code = ?, 
          phone = ?, email = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
      `, [company_name, address, gstin, state, state_code, phone, email]);
    } else {
      // Insert new settings
      await run(`
        INSERT INTO company_settings (
          id, company_name, address, gstin, state, state_code, phone, email
        ) VALUES (1, ?, ?, ?, ?, ?, ?, ?)
      `, [company_name, address, gstin, state, state_code, phone, email]);
    }
    
    const company = await get('SELECT * FROM company_settings WHERE id = 1');
    res.json(company);
  } catch (error) {
    console.error('Error updating company settings:', error);
    res.status(500).json({ error: 'Failed to update company settings' });
  }
});

// Upload company logo
router.post('/logo', upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No logo file provided' });
    }
    
    const logoPath = `/uploads/${req.file.filename}`;
    
    // Check if company settings exist
    const existing = await get('SELECT * FROM company_settings WHERE id = 1');
    
    if (existing) {
      await run('UPDATE company_settings SET logo_path = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1', [logoPath]);
    } else {
      await run(`
        INSERT INTO company_settings (id, company_name, logo_path) 
        VALUES (1, ?, ?)
      `, [process.env.DEFAULT_COMPANY_NAME || 'Your Company Name', logoPath]);
    }
    
    res.json({ logo_path: logoPath, message: 'Logo uploaded successfully' });
  } catch (error) {
    console.error('Error uploading logo:', error);
    res.status(500).json({ error: 'Failed to upload logo' });
  }
});

// Upload signature
router.post('/signature', upload.single('signature'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No signature file provided' });
    }
    
    const signaturePath = `/uploads/${req.file.filename}`;
    
    // Check if company settings exist
    const existing = await get('SELECT * FROM company_settings WHERE id = 1');
    
    if (existing) {
      await run('UPDATE company_settings SET signature_path = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1', [signaturePath]);
    } else {
      await run(`
        INSERT INTO company_settings (id, company_name, signature_path) 
        VALUES (1, ?, ?)
      `, [process.env.DEFAULT_COMPANY_NAME || 'Your Company Name', signaturePath]);
    }
    
    res.json({ signature_path: signaturePath, message: 'Signature uploaded successfully' });
  } catch (error) {
    console.error('Error uploading signature:', error);
    res.status(500).json({ error: 'Failed to upload signature' });
  }
});

export default router;