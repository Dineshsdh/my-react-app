import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = process.env.SQLITE_PATH || join(__dirname, 'data.sqlite');

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  address TEXT,
  gstin TEXT,
  state TEXT,
  stateCode TEXT
);

CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number TEXT,
  date TEXT,
  customerId INTEGER,
  cgstRate REAL,
  sgstRate REAL,
  subtotal REAL,
  cgstAmount REAL,
  sgstAmount REAL,
  roundOff REAL,
  grandTotal REAL,
  amountInWords TEXT,
  FOREIGN KEY(customerId) REFERENCES customers(id)
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoiceId INTEGER,
  description TEXT,
  weight TEXT,
  hsnCode TEXT,
  quantity REAL,
  rate REAL,
  amount REAL,
  FOREIGN KEY(invoiceId) REFERENCES invoices(id)
);
`);

export function listCustomers() {
  const stmt = db.prepare('SELECT id, name, address, gstin, state, stateCode FROM customers ORDER BY name');
  return stmt.all();
}

export function upsertCustomer(customer) {
  const { name, address = '', gstin = '', state = '', stateCode = '' } = customer;
  if (!name || !name.trim()) {
    throw new Error('Customer name is required');
  }
  const insert = db.prepare(`
    INSERT INTO customers (name, address, gstin, state, stateCode)
    VALUES (@name, @address, @gstin, @state, @stateCode)
    ON CONFLICT(name) DO UPDATE SET
      address = excluded.address,
      gstin = excluded.gstin,
      state = excluded.state,
      stateCode = excluded.stateCode
  `);
  insert.run({ name: name.trim(), address, gstin, state, stateCode });
  const row = db.prepare('SELECT id, name, address, gstin, state, stateCode FROM customers WHERE name = ?').get(name.trim());
  return row;
}

export function clearCustomers() {
  db.prepare('DELETE FROM customers').run();
}

export function createInvoiceWithItems(invoice) {
  const {
    // Company info ignored for storage except possibly future use
    customerName,
    customerAddress,
    customerGstin,
    customerState,
    customerStateCode,
    invoiceNumber,
    invoiceDate,
    items = [],
    cgstRate = 0,
    sgstRate = 0,
    subtotal = 0,
    cgstAmount = 0,
    sgstAmount = 0,
    roundOff = 0,
    grandTotal = 0,
    amountInWords = ''
  } = invoice;

  const customer = upsertCustomer({
    name: customerName,
    address: customerAddress,
    gstin: customerGstin,
    state: customerState,
    stateCode: customerStateCode
  });

  const insertInvoice = db.prepare(`
    INSERT INTO invoices (
      number, date, customerId, cgstRate, sgstRate, subtotal, cgstAmount, sgstAmount, roundOff, grandTotal, amountInWords
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = insertInvoice.run(
    invoiceNumber || '',
    invoiceDate || '',
    customer.id,
    cgstRate,
    sgstRate,
    subtotal,
    cgstAmount,
    sgstAmount,
    roundOff,
    grandTotal,
    amountInWords
  );

  const invoiceId = result.lastInsertRowid;

  const insertItem = db.prepare(`
    INSERT INTO invoice_items (invoiceId, description, weight, hsnCode, quantity, rate, amount)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((itemsToInsert) => {
    for (const it of itemsToInsert) {
      insertItem.run(
        invoiceId,
        it.description || '',
        it.weight || '',
        it.hsnCode || '',
        Number(it.quantity) || 0,
        Number(it.rate) || 0,
        Number(it.amount) || 0
      );
    }
  });

  insertMany(items);
  return invoiceId;
}

export function listInvoices() {
  const rows = db.prepare(`
    SELECT inv.id, inv.number, inv.date, inv.grandTotal,
           c.name AS customerName
    FROM invoices inv
    LEFT JOIN customers c ON c.id = inv.customerId
    ORDER BY inv.id DESC
  `).all();
  return rows;
}

export function getInvoiceById(id) {
  const invoice = db.prepare(`
    SELECT inv.*, c.name AS customerName, c.address AS customerAddress,
           c.gstin AS customerGstin, c.state AS customerState, c.stateCode AS customerStateCode
    FROM invoices inv
    LEFT JOIN customers c ON c.id = inv.customerId
    WHERE inv.id = ?
  `).get(id);
  if (!invoice) return null;
  const items = db.prepare('SELECT id, description, weight, hsnCode, quantity, rate, amount FROM invoice_items WHERE invoiceId = ? ORDER BY id').all(id);
  invoice.items = items;
  return invoice;
}

export default db;