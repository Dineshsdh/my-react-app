import express from 'express';
import { listCustomers, upsertCustomer, clearCustomers, createInvoiceWithItems, listInvoices, getInvoiceById } from './db.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/customers', (req, res) => {
  try {
    const customers = listCustomers();
    res.json(customers);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/customers', (req, res) => {
  try {
    const saved = upsertCustomer(req.body || {});
    res.status(201).json(saved);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.delete('/api/customers', (req, res) => {
  try {
    clearCustomers();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/invoices', (req, res) => {
  try {
    const invoices = listInvoices();
    res.json(invoices);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/invoices/:id', (req, res) => {
  try {
    const invoice = getInvoiceById(Number(req.params.id));
    if (!invoice) return res.status(404).json({ error: 'Not found' });
    res.json(invoice);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/invoices', (req, res) => {
  try {
    const id = createInvoiceWithItems(req.body || {});
    res.status(201).json({ id });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});