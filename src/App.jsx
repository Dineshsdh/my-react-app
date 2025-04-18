import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Form, 
  Button, 
  Table,
  InputGroup
} from 'react-bootstrap';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import InvoiceTemplate from './InvoiceTemplate';

// Main App component with routing
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<GSTInvoiceGenerator />} />
        <Route path="/invoice" element={<InvoiceTemplate />} />
      </Routes>
    </Router>
  );
}

function GSTInvoiceGenerator() {
  const navigate = useNavigate();
  
  // State management
  const [items, setItems] = useState([
    { id: '1', description: '', weight: '0', hsnCode: '', quantity: 0, rate: 0, amount: 0 }
  ]);
  const [cgstRate, setCgstRate] = useState(9);
  const [sgstRate, setSgstRate] = useState(9);
  const [roundOff, setRoundOff] = useState(0);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    address: '',
    gstin: '',
    state: '',
    stateCode: '',
  });
  // Add this right after the other useState declarations in GSTInvoiceGenerator
const [companyInfo] = useState({
  name: 'MEENA TRADERS',
  tagline: 'YARN & WARP TRADERS',
  address: 'Ground Floor, 56/8 Mu Su Thottannan Kadu,\nKarungalpatti Main Road, Gugai, SALEM - 636 006.',
  gstin: '33RVLPS4153P1ZG',
  state: 'Tamilnadu',
  stateCode: '33',
  phone: '63803 86768'
});
  const [invoiceInfo, setInvoiceInfo] = useState({
    number: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [subtotal, setSubtotal] = useState(0);
  const [cgstAmount, setCgstAmount] = useState(0);
  const [sgstAmount, setSgstAmount] = useState(0);
  const [totalTax, setTotalTax] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [amountInWords, setAmountInWords] = useState('Rupees Zero Only');

  // Helper functions
  const calculateAmount = (weight, quantity, rate) => {
    const weightNum = parseFloat(weight) || 0;
    return weightNum * quantity * rate;
  };

  const calculateAutoRoundOff = () => {
    const initialTotal = subtotal + totalTax;
    const roundedTotal = Math.round(initialTotal);
    return roundedTotal - initialTotal;
  };

  // Convert number to words function
  const numberToWords = (num) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
      'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const scales = ['', 'Thousand', 'Lakh', 'Crore'];
    
    if (num === 0) return 'Zero';
    
    // For decimal handling
    let rupees = Math.floor(num);
    let paise = Math.round((num - rupees) * 100);
    
    function convertGroupOfDigits(num) {
      if (num === 0) return '';
      else if (num < 20) return ones[num];
      else if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + ones[num % 10] : '');
      else return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 !== 0 ? ' ' + convertGroupOfDigits(num % 100) : '');
    }
    
    let words = '';
    let digits = 0;
    
    // Handle crores (1,00,00,000)
    digits = Math.floor(rupees / 10000000) % 100;
    if (digits > 0) words += convertGroupOfDigits(digits) + ' ' + scales[3] + ' ';
    
    // Handle lakhs (1,00,000)
    digits = Math.floor(rupees / 100000) % 100;
    if (digits > 0) words += convertGroupOfDigits(digits) + ' ' + scales[2] + ' ';
    
    // Handle thousands (1,000)
    digits = Math.floor(rupees / 1000) % 100;
    if (digits > 0) words += convertGroupOfDigits(digits) + ' ' + scales[1] + ' ';
    
    // Handle hundreds, tens, and ones
    digits = rupees % 1000;
    if (digits > 0) words += convertGroupOfDigits(digits);
    
    // Add rupees text
    words = words.trim() + ' Rupees';
    
    // Add paise if any
    if (paise > 0) {
      words += ' and ' + convertGroupOfDigits(paise) + ' Paise';
    }
    
    return words + ' Only';
  };

  // Handle customer and invoice info changes
  const handleCustomerInfoChange = (field, value) => {
    setCustomerInfo({
      ...customerInfo,
      [field]: value
    });
  };

  const handleInvoiceInfoChange = (field, value) => {
    setInvoiceInfo({
      ...invoiceInfo,
      [field]: value
    });
  };

  // Handle item changes
  const handleItemChange = (id, field, value) => {
    const updatedItems = items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        if (field === 'weight' || field === 'quantity' || field === 'rate') {
          const weight = field === 'weight' ? value : item.weight;
          const quantity = field === 'quantity' ? Number(value) : item.quantity;
          const rate = field === 'rate' ? Number(value) : item.rate;
          
          updatedItem.amount = calculateAmount(weight, quantity, rate);
        }
        return updatedItem;
      }
      return item;
    });
    
    setItems(updatedItems);
  };

  // Add new item
  const addItem = () => {
    const newItem = {
      id: Date.now().toString(),
      description: '',
      weight: '0',
      hsnCode: '',
      quantity: 0,
      rate: 0,
      amount: 0
    };
    setItems([...items, newItem]);
  };

  // Remove item
  const removeItem = (id) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  // Apply auto round off
  const applyAutoRoundOff = () => {
    const calculatedRoundOff = calculateAutoRoundOff();
    setRoundOff(calculatedRoundOff);
  };

  const generateInvoice = () => {
    // Validation
    if (!customerInfo.name) {
      alert('Please enter customer name');
      return;
    }
    
    if (!invoiceInfo.number) {
      alert('Please enter invoice number');
      return;
    }
    
    if (items.length === 0 || subtotal === 0) {
      alert('Please add at least one item with quantity and rate');
      return;
    }
    
   // Collect all invoice data
   const invoiceData = {
    // Company details (add this)
    companyName: companyInfo.name,
    companyTagline: companyInfo.tagline,
    companyAddress: companyInfo.address,
    companyGstin: companyInfo.gstin,
    companyState: companyInfo.state,
    companyStateCode: companyInfo.stateCode,
    companyPhone: companyInfo.phone,
    
    // Customer details
    customerName: customerInfo.name,
    customerAddress: customerInfo.address,
    customerGstin: customerInfo.gstin,
    customerState: customerInfo.state,
    customerStateCode: customerInfo.stateCode,
    
    // Invoice details
    invoiceNumber: invoiceInfo.number,
    invoiceDate: invoiceInfo.date,
    
    // Items
    items: items,
    
    // Tax details
    cgstRate,
    sgstRate,
    subtotal,
    cgstAmount,
    sgstAmount,
    roundOff,
    grandTotal,
    
    // Amount in words
    amountInWords
  };
  
  // Store invoice data in localStorage to access it from the template
  localStorage.setItem('invoiceData', JSON.stringify(invoiceData));
  
  // Navigate to the invoice template page
  navigate('/invoice');
};

  // Update totals whenever relevant values change
  useEffect(() => {
    const calculatedSubtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const calculatedCgstAmount = (calculatedSubtotal * cgstRate) / 100;
    const calculatedSgstAmount = (calculatedSubtotal * sgstRate) / 100;
    const calculatedTotalTax = calculatedCgstAmount + calculatedSgstAmount;
    const calculatedGrandTotal = calculatedSubtotal + calculatedTotalTax + roundOff;
    
    setSubtotal(calculatedSubtotal);
    setCgstAmount(calculatedCgstAmount);
    setSgstAmount(calculatedSgstAmount);
    setTotalTax(calculatedTotalTax);
    setGrandTotal(calculatedGrandTotal);
    
    // Update amount in words
    setAmountInWords(numberToWords(calculatedGrandTotal));
  }, [items, cgstRate, sgstRate, roundOff]);

  return (
    <Container className="py-4">
      <h2 className="text-center mb-4">GST Invoice</h2>
      
      {/* Header Grid - Customer and Invoice Info */}
      <Row className="mb-4">
        <Col md={6}>
          <Card>
            <Card.Body>
              <Card.Title as="h5">Details of Receiver / Billed to</Card.Title>
              <Form>
                <Row className="mb-2">
                  <Col sm={4}>
                    <Form.Label>Name:</Form.Label>
                  </Col>
                  <Col sm={8}>
                    <Form.Control 
                      type="text" 
                      placeholder="Enter customer name"
                      value={customerInfo.name}
                      onChange={(e) => handleCustomerInfoChange('name', e.target.value)}
                    />
                  </Col>
                </Row>
                
                <Row className="mb-2">
                  <Col sm={4}>
                    <Form.Label>Address:</Form.Label>
                  </Col>
                  <Col sm={8}>
                    <Form.Control 
                      as="textarea" 
                      rows={2}
                      placeholder="Enter customer address"
                      value={customerInfo.address}
                      onChange={(e) => handleCustomerInfoChange('address', e.target.value)}
                    />
                  </Col>
                </Row>
                
                <Row className="mb-2">
                  <Col sm={4}>
                    <Form.Label>GSTIN:</Form.Label>
                  </Col>
                  <Col sm={8}>
                    <Form.Control 
                      type="text" 
                      placeholder="Enter GSTIN"
                      value={customerInfo.gstin}
                      onChange={(e) => handleCustomerInfoChange('gstin', e.target.value)}
                    />
                  </Col>
                </Row>
                
                <Row className="mb-2">
                  <Col sm={4}>
                    <Form.Label>State:</Form.Label>
                  </Col>
                  <Col sm={8}>
                    <Form.Control 
                      type="text" 
                      placeholder="Enter state"
                      value={customerInfo.state}
                      onChange={(e) => handleCustomerInfoChange('state', e.target.value)}
                    />
                  </Col>
                </Row>
                
                <Row>
                  <Col sm={4}>
                    <Form.Label>State Code:</Form.Label>
                  </Col>
                  <Col sm={8}>
                    <Form.Control 
                      type="text" 
                      placeholder="Enter state code"
                      value={customerInfo.stateCode}
                      onChange={(e) => handleCustomerInfoChange('stateCode', e.target.value)}
                    />
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card>
            <Card.Body>
              <Card.Title as="h5">Invoice Details</Card.Title>
              <Form>
                <Row className="mb-2">
                  <Col sm={4}>
                    <Form.Label>Invoice No:</Form.Label>
                  </Col>
                  <Col sm={8}>
                    <Form.Control 
                      type="text" 
                      placeholder="Enter invoice number"
                      value={invoiceInfo.number}
                      onChange={(e) => handleInvoiceInfoChange('number', e.target.value)}
                    />
                  </Col>
                </Row>
                
                <Row>
                  <Col sm={4}>
                    <Form.Label>Invoice Date:</Form.Label>
                  </Col>
                  <Col sm={8}>
                    <Form.Control 
                      type="date"
                      value={invoiceInfo.date}
                      onChange={(e) => handleInvoiceInfoChange('date', e.target.value)}
                    />
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Invoice Items Table */}
      <div className="mb-3">
        <Table bordered responsive>
          <thead>
            <tr>
              <th>Product Description</th>
              <th>Weight</th>
              <th>HSN Code</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>Amount</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                <td>
                  <Form.Control
                    type="text"
                    value={item.description}
                    placeholder="Enter product description"
                    onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                  />
                </td>
                <td>
                  <Form.Control
                    type="text"
                    value={item.weight}
                    placeholder="Enter weight"
                    onChange={(e) => handleItemChange(item.id, 'weight', e.target.value)}
                  />
                </td>
                <td>
                  <Form.Control
                    type="text"
                    value={item.hsnCode}
                    placeholder="Enter HSN code"
                    onChange={(e) => handleItemChange(item.id, 'hsnCode', e.target.value)}
                  />
                </td>
                <td>
                  <Form.Control
                    type="number"
                    value={item.quantity || ''}
                    placeholder="Qty"
                    onChange={(e) => handleItemChange(item.id, 'quantity', Number(e.target.value))}
                  />
                </td>
                <td>
                  <Form.Control
                    type="number"
                    value={item.rate || ''}
                    placeholder="Rate"
                    onChange={(e) => handleItemChange(item.id, 'rate', Number(e.target.value))}
                  />
                </td>
                <td className="text-end">₹{item.amount.toFixed(2)}</td>
                <td>
                  <Button 
                    variant="danger" 
                    size="sm"
                    onClick={() => removeItem(item.id)}
                  >
                    Remove
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
      
      <div className="mb-4">
        <Button variant="primary" onClick={addItem}>Add Item</Button>
      </div>
      
      {/* Lower Section - GST Details and Summary */}
      <Row>
        <Col md={6}>
          <Card className="mb-3">
            <Card.Body>
              <Card.Title as="h5">GST Details</Card.Title>
              
              <Form.Group as={Row} className="mb-2">
                <Form.Label column sm={4}>CGST Rate (%):</Form.Label>
                <Col sm={3}>
                  <Form.Control 
                    type="number" 
                    value={cgstRate}
                    onChange={(e) => setCgstRate(Number(e.target.value))}
                  />
                </Col>
                <Col sm={5}>
                  <Form.Text>Amount: ₹{cgstAmount.toFixed(2)}</Form.Text>
                </Col>
              </Form.Group>
              
              <Form.Group as={Row} className="mb-2">
                <Form.Label column sm={4}>SGST Rate (%):</Form.Label>
                <Col sm={3}>
                  <Form.Control 
                    type="number" 
                    value={sgstRate}
                    onChange={(e) => setSgstRate(Number(e.target.value))}
                  />
                </Col>
                <Col sm={5}>
                  <Form.Text>Amount: ₹{sgstAmount.toFixed(2)}</Form.Text>
                </Col>
              </Form.Group>
              
              <Form.Group as={Row} className="mb-3">
                <Form.Label column sm={4}>Total Tax:</Form.Label>
                <Col sm={8}>
                  <Form.Text className="fw-bold">₹{totalTax.toFixed(2)}</Form.Text>
                </Col>
              </Form.Group>
              
              <Form.Group as={Row}>
                <Form.Label column sm={4}>Round Off:</Form.Label>
                <Col sm={3}>
                  <Form.Control 
                    type="number" 
                    value={roundOff}
                    step="0.01"
                    onChange={(e) => setRoundOff(Number(e.target.value))}
                  />
                </Col>
                <Col sm={5}>
                  <Button 
                    variant="link" 
                    className="p-0" 
                    onClick={applyAutoRoundOff}
                  >
                    Auto-round
                  </Button>
                </Col>
              </Form.Group>
            </Card.Body>
          </Card>
          
          <Card>
            <Card.Body>
              <Card.Title as="h5">Total in Words</Card.Title>
              <div className="bg-light p-2 fst-italic rounded">
                {amountInWords}
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between border-bottom py-2">
                <span className="fw-medium">Subtotal:</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              
              <div className="d-flex justify-content-between border-bottom py-2">
                <span className="fw-medium">CGST:</span>
                <span>₹{cgstAmount.toFixed(2)}</span>
              </div>
              
              <div className="d-flex justify-content-between border-bottom py-2">
                <span className="fw-medium">SGST:</span>
                <span>₹{sgstAmount.toFixed(2)}</span>
              </div>
              
              <div className="d-flex justify-content-between border-bottom py-2">
                <span className="fw-medium">Round Off:</span>
                <span>₹{roundOff.toFixed(2)}</span>
              </div>
              
              <div className="d-flex justify-content-between py-3">
                <span className="fw-bold fs-5">Grand Total:</span>
                <span className="fw-bold fs-5">₹{grandTotal.toFixed(2)}</span>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Generate Button */}
      <div className="d-flex justify-content-center mt-4">
        <Button 
          variant="success" 
          size="lg" 
          onClick={generateInvoice}
        >
          Generate Invoice
        </Button>
      </div>
    </Container>
  );
}

export default App;