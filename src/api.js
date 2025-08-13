export async function listCustomers() {
  const response = await fetch('/api/customers');
  if (!response.ok) throw new Error('Failed to load customers');
  return response.json();
}

export async function saveCustomer(customer) {
  const response = await fetch('/api/customers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(customer),
  });
  if (!response.ok) throw new Error('Failed to save customer');
  return response.json();
}

export async function clearAllCustomers() {
  const response = await fetch('/api/customers', { method: 'DELETE' });
  if (!response.ok) throw new Error('Failed to clear customers');
  return response.json();
}

export async function createInvoice(invoiceData) {
  const response = await fetch('/api/invoices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(invoiceData),
  });
  if (!response.ok) throw new Error('Failed to create invoice');
  return response.json();
}