import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database configuration
const DB_PATH = join(__dirname, '..', 'data', 'invoice.db');

// Create connection
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON');
  }
});

// Initialize database tables
export const initializeDatabase = () => {
  return new Promise((resolve, reject) => {
    // Create customers table
    db.run(`
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        address TEXT,
        gstin TEXT,
        state TEXT,
        state_code TEXT,
        phone TEXT,
        email TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) return reject(err);
      
      // Create invoices table
      db.run(`
        CREATE TABLE IF NOT EXISTS invoices (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          invoice_number TEXT UNIQUE NOT NULL,
          customer_id INTEGER,
          invoice_date DATE NOT NULL,
          due_date DATE,
          subtotal DECIMAL(10,2) NOT NULL,
          cgst_rate DECIMAL(5,2) DEFAULT 9.00,
          sgst_rate DECIMAL(5,2) DEFAULT 9.00,
          cgst_amount DECIMAL(10,2) NOT NULL,
          sgst_amount DECIMAL(10,2) NOT NULL,
          total_tax DECIMAL(10,2) NOT NULL,
          round_off DECIMAL(10,2) DEFAULT 0.00,
          grand_total DECIMAL(10,2) NOT NULL,
          amount_in_words TEXT,
          status TEXT DEFAULT 'draft',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (customer_id) REFERENCES customers (id)
        )
      `, (err) => {
        if (err) return reject(err);
        
        // Create invoice_items table
        db.run(`
          CREATE TABLE IF NOT EXISTS invoice_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            invoice_id INTEGER NOT NULL,
            description TEXT NOT NULL,
            weight TEXT,
            hsn_code TEXT,
            quantity DECIMAL(10,2) NOT NULL,
            rate DECIMAL(10,2) NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (invoice_id) REFERENCES invoices (id) ON DELETE CASCADE
          )
        `, (err) => {
          if (err) return reject(err);
          
          // Create company_settings table
          db.run(`
            CREATE TABLE IF NOT EXISTS company_settings (
              id INTEGER PRIMARY KEY CHECK (id = 1),
              company_name TEXT NOT NULL,
              address TEXT,
              gstin TEXT,
              state TEXT,
              state_code TEXT,
              phone TEXT,
              email TEXT,
              logo_path TEXT,
              signature_path TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `, (err) => {
            if (err) return reject(err);
            
            console.log('Database tables initialized successfully');
            resolve();
          });
        });
      });
    });
  });
};

// Helper function to run queries with promises
export const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// Helper function to run single operations
export const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
};

// Helper function to get single row
export const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

export default db;