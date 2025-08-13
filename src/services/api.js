const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Generic API request function with error handling
const apiRequest = async (url, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return response;
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

// Customer API
export const customerAPI = {
  // Get all customers with pagination and search
  getCustomers: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/customers${queryString ? `?${queryString}` : ''}`);
  },

  // Get customer by ID
  getCustomer: (id) => apiRequest(`/customers/${id}`),

  // Create new customer
  createCustomer: (customerData) => 
    apiRequest('/customers', {
      method: 'POST',
      body: JSON.stringify(customerData),
    }),

  // Update customer
  updateCustomer: (id, customerData) =>
    apiRequest(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(customerData),
    }),

  // Delete customer
  deleteCustomer: (id) =>
    apiRequest(`/customers/${id}`, { method: 'DELETE' }),

  // Search customers for autocomplete
  searchCustomers: (term) => apiRequest(`/customers/search/${encodeURIComponent(term)}`),
};

// Invoice API
export const invoiceAPI = {
  // Get all invoices with filters
  getInvoices: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/invoices${queryString ? `?${queryString}` : ''}`);
  },

  // Get invoice by ID
  getInvoice: (id) => apiRequest(`/invoices/${id}`),

  // Create new invoice
  createInvoice: (invoiceData) =>
    apiRequest('/invoices', {
      method: 'POST',
      body: JSON.stringify(invoiceData),
    }),

  // Update invoice
  updateInvoice: (id, invoiceData) =>
    apiRequest(`/invoices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(invoiceData),
    }),

  // Delete invoice
  deleteInvoice: (id) =>
    apiRequest(`/invoices/${id}`, { method: 'DELETE' }),

  // Get next invoice number
  getNextInvoiceNumber: () => apiRequest('/invoices/next/number'),
};

// Company API
export const companyAPI = {
  // Get company settings
  getCompanySettings: () => apiRequest('/company'),

  // Update company settings
  updateCompanySettings: (companyData) =>
    apiRequest('/company', {
      method: 'PUT',
      body: JSON.stringify(companyData),
    }),

  // Upload company logo
  uploadLogo: (file) => {
    const formData = new FormData();
    formData.append('logo', file);
    
    return apiRequest('/company/logo', {
      method: 'POST',
      headers: {}, // Remove Content-Type header to let browser set it for FormData
      body: formData,
    });
  },

  // Upload signature
  uploadSignature: (file) => {
    const formData = new FormData();
    formData.append('signature', file);
    
    return apiRequest('/company/signature', {
      method: 'POST',
      headers: {}, // Remove Content-Type header to let browser set it for FormData
      body: formData,
    });
  },
};

// Utility functions
export const utils = {
  // Format currency
  formatCurrency: (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  },

  // Format date
  formatDate: (date) => {
    return new Intl.DateTimeFormat('en-IN').format(new Date(date));
  },

  // Convert number to words (for amount in words)
  numberToWords: (amount) => {
    // Simple implementation - you can enhance this
    const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    if (amount === 0) return 'Zero';
    
    const convertHundreds = (num) => {
      let result = '';
      
      if (num >= 100) {
        result += units[Math.floor(num / 100)] + ' Hundred ';
        num %= 100;
      }
      
      if (num >= 20) {
        result += tens[Math.floor(num / 10)] + ' ';
        num %= 10;
      } else if (num >= 10) {
        result += teens[num - 10] + ' ';
        num = 0;
      }
      
      if (num > 0) {
        result += units[num] + ' ';
      }
      
      return result.trim();
    };
    
    const wholeAmount = Math.floor(amount);
    const decimal = Math.round((amount - wholeAmount) * 100);
    
    let result = '';
    
    if (wholeAmount >= 10000000) {
      result += convertHundreds(Math.floor(wholeAmount / 10000000)) + ' Crore ';
      wholeAmount %= 10000000;
    }
    
    if (wholeAmount >= 100000) {
      result += convertHundreds(Math.floor(wholeAmount / 100000)) + ' Lakh ';
      wholeAmount %= 100000;
    }
    
    if (wholeAmount >= 1000) {
      result += convertHundreds(Math.floor(wholeAmount / 1000)) + ' Thousand ';
      wholeAmount %= 1000;
    }
    
    if (wholeAmount > 0) {
      result += convertHundreds(wholeAmount);
    }
    
    result = result.trim() + ' Rupees';
    
    if (decimal > 0) {
      result += ' and ' + convertHundreds(decimal) + ' Paise';
    }
    
    return result + ' Only';
  },

  // Debounce function for search
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },
};

// Health check
export const healthCheck = () => apiRequest('/health', { method: 'GET' });