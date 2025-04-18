import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Table, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';

// Define styles for PDF content with optimized spacing and font sizes
const styles = StyleSheet.create({
  page: {
    padding: 20, // Reduced from 30
    fontSize: 10, // Reduced from 12
    fontFamily: 'Helvetica',
    height: '100%',
  },
  logo: {
    width: 80,
    height: 80,
    marginRight: 10,
  },
  section: {
    margin: 5, // Reduced from 10
    padding: 5, // Reduced from 10
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
    paddingBottom: 5,
    alignItems: 'center', // Center items vertically
  },
  headerLeft: {
    flexDirection: 'row',
    width: '60%',
    alignItems: 'center', // Center items vertically
  },
  headerRight: {
    flexDirection: 'column',
    width: '40%',
    alignItems: 'flex-end',
  },
  headerText: {
    flexDirection: 'column',
    alignItems: 'center', // Center text horizontally
  },
  companyName: {
    fontSize: 16, // Reduced from 18
    fontWeight: 'bold',
    marginBottom: 3, // Reduced from 5
    color: '#0d6efd',
  },
  companyTagline: {
    fontSize: 12, // Reduced from 14
    fontWeight: 'bold',
    marginBottom: 3, // Reduced from 5
  },
  taxInvoice: {
    fontSize: 12, // Reduced from 14
    fontWeight: 'bold',
    border: '1px solid black',
    padding: 3, // Reduced from 5
    textAlign: 'center',
    marginBottom: 3, // Reduced from 5
  },
  row: {
    flexDirection: 'row',
    marginVertical: 3, // Reduced from 5
  },
  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10, // Reduced from 20
  },
  infoBox: {
    width: '48%',
    border: '1px solid #dee2e6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  infoHeader: {
    backgroundColor: '#f8f9fa',
    padding: 3, // Reduced from 5
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
    fontWeight: 'bold',
  },
  infoBody: {
    padding: 5, // Reduced from 10
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 2, // Reduced from 5
  },
  infoLabel: {
    fontWeight: 'bold',
    marginRight: 3, // Reduced from 5
    width: '30%',
  },
  infoValue: {
    width: '70%',
  },
  table: {
    display: 'table',
    width: 'auto',
    marginVertical: 5, // Reduced from 10
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
  },
  tableHeader: {
    backgroundColor: '#f8f9fa',
    fontWeight: 'bold',
  },
  tableCol: {
    padding: 3, // Reduced from 5
    borderRightWidth: 1,
    borderRightColor: '#dee2e6',
  },
  colSNo: { width: '5%' },
  colDesc: { width: '45%' },
  colHSN: { width: '10%' },
  colQty: { width: '10%' },
  colRate: { width: '15%' },
  colAmount: { width: '15%' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    fontWeight: 'bold',
  },
  amountWords: {
    fontStyle: 'italic',
    marginBottom: 3, // Reduced from 5
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
    paddingBottom: 3, // Reduced from 5
  },
  bankDetails: {
    marginVertical: 5, // Reduced from 10
  },
  bankItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
    paddingVertical: 2, // Reduced from 3
  },
  termsTitle: {
    fontWeight: 'bold',
    marginTop: 5, // Reduced from 10
    marginBottom: 3, // Reduced from 5
  },
  termItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
    paddingVertical: 2, // Reduced from 3
  },
  signature: {
    alignItems: 'center',
    marginTop: 10, // Reduced from 20
  },
  signatureLine: {
    width: 150,
    borderBottomWidth: 1,
    borderBottomColor: 'black',
    marginBottom: 3, // Reduced from 5
  }
});

// Create Invoice PDF Document component
const InvoicePDF = ({ invoiceData }) => {
  const {
    companyName = "MEENA TRADERS",
    companyTagline = "YARN & WARP TRADERS",
    companyAddress = "Ground Floor, 56/8 Mu Su Thottannan Kadu,\nKarungalpatti Main Road, Gugai, SALEM - 636 006.",
    companyPhone = "63803 86768",
    companyGstin = "33RVLPS4153P1ZG",
    companyState = "Tamilnadu",
    companyStateCode = "33",
    companyLogo = null,
    
    customerName,
    customerAddress,
    customerGstin,
    customerState,
    customerStateCode,
    
    invoiceNumber,
    invoiceDate,
    
    items = [],
    
    cgstRate,
    sgstRate,
    subtotal,
    cgstAmount,
    sgstAmount,
    roundOff,
    grandTotal,
    
    amountInWords,
    signatureImage = null
  } = invoiceData;
  
  const addressLines = companyAddress.split('\n');

  // Calculate number of rows needed in the items table
  const itemsLength = items.length;
  const emptyRowsNeeded = Math.max(0, 3 - itemsLength); // Reduced to 3 empty rows

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Updated Header with Logo */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {/* Company Logo */}
            {companyLogo ? (
              <Image
                src={companyLogo}
                style={styles.logo}
              />
            ) : (
              <View style={styles.logo} /> // Empty placeholder if no logo
            )}
            
            {/* Company Text - Centered */}
            <View style={styles.headerText}>
              <Text style={styles.companyName}>{companyName}</Text>
              <Text style={styles.companyTagline}>{companyTagline}</Text>
              {addressLines.map((line, i) => (
                <Text key={i}>{line}</Text>
              ))}
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.taxInvoice}>TAX INVOICE</Text>
            <Text>Cell: {companyPhone}</Text>
          </View>
        </View>

        {/* Company Info */}
        <View style={styles.infoSection}>
          <View style={{ width: '60%' }}>
            <Text><Text style={{ fontWeight: 'bold' }}>GSTIN:</Text> {companyGstin}</Text>
            <View style={styles.row}>
              <Text style={{ marginRight: 10 }}><Text style={{ fontWeight: 'bold' }}>Reverse Charge:</Text> Yes / No</Text>
              <Text><Text style={{ fontWeight: 'bold' }}>State:</Text> {companyState}</Text>
            </View>
            <Text><Text style={{ fontWeight: 'bold' }}>State Code:</Text> {companyStateCode}</Text>
          </View>
          <View style={{ width: '40%', alignItems: 'flex-end' }}>
            <Text><Text style={{ fontWeight: 'bold' }}>Invoice No:</Text> {invoiceNumber}</Text>
            <Text><Text style={{ fontWeight: 'bold' }}>Invoice Date:</Text> {invoiceDate}</Text>
          </View>
        </View>

        {/* Customer Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoBox}>
            <View style={styles.infoHeader}>
              <Text>Details of Receiver / Billed to:</Text>
            </View>
            <View style={styles.infoBody}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Name:</Text>
                <Text style={styles.infoValue}>{customerName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Address:</Text>
                <Text style={styles.infoValue}>{customerAddress}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>GSTIN:</Text>
                <Text style={styles.infoValue}>{customerGstin}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>State:</Text>
                <Text style={styles.infoValue}>{customerState}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>State Code:</Text>
                <Text style={styles.infoValue}>{customerStateCode}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.infoBox}>
            <View style={styles.infoHeader}>
              <Text>Details of Consignee / Shipped to:</Text>
            </View>
            <View style={styles.infoBody}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Name:</Text>
                <Text style={styles.infoValue}></Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Address:</Text>
                <Text style={styles.infoValue}></Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>GSTIN:</Text>
                <Text style={styles.infoValue}></Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>State:</Text>
                <Text style={styles.infoValue}></Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>State Code:</Text>
                <Text style={styles.infoValue}></Text>
              </View>
            </View>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <View style={[styles.tableCol, styles.colSNo]}>
              <Text>S. No.</Text>
            </View>
            <View style={[styles.tableCol, styles.colDesc]}>
              <Text>Product Description</Text>
            </View>
            <View style={[styles.tableCol, styles.colHSN]}>
              <Text>HSN Code</Text>
            </View>
            <View style={[styles.tableCol, styles.colQty]}>
              <Text>Qty</Text>
            </View>
            <View style={[styles.tableCol, styles.colRate]}>
              <Text>Rate</Text>
            </View>
            <View style={[styles.tableCol, styles.colAmount]}>
              <Text>Amount Rs.</Text>
            </View>
          </View>
          
          {/* Table Body */}
          {items.map((item, index) => (
            <View key={item.id || index} style={styles.tableRow}>
              <View style={[styles.tableCol, styles.colSNo]}>
                <Text>{index + 1}</Text>
              </View>
              <View style={[styles.tableCol, styles.colDesc]}>
                <Text>{item.description} {item.weight ? `(${item.weight})` : ''}</Text>
              </View>
              <View style={[styles.tableCol, styles.colHSN]}>
                <Text>{item.hsnCode}</Text>
              </View>
              <View style={[styles.tableCol, styles.colQty]}>
                <Text>{item.quantity}</Text>
              </View>
              <View style={[styles.tableCol, styles.colRate]}>
                <Text>{item.rate.toFixed(2)}</Text>
              </View>
              <View style={[styles.tableCol, styles.colAmount]}>
                <Text>{item.amount.toFixed(2)}</Text>
              </View>
            </View>
          ))}
          
          {/* Empty rows to maintain layout - reduced to 3 max */}
          {Array.from({ length: emptyRowsNeeded }, (_, i) => (
            <View key={`empty-${i}`} style={styles.tableRow}>
              <View style={[styles.tableCol, styles.colSNo]}>
                <Text> </Text>
              </View>
              <View style={[styles.tableCol, styles.colDesc]}>
                <Text> </Text>
              </View>
              <View style={[styles.tableCol, styles.colHSN]}>
                <Text> </Text>
              </View>
              <View style={[styles.tableCol, styles.colQty]}>
                <Text> </Text>
              </View>
              <View style={[styles.tableCol, styles.colRate]}>
                <Text> </Text>
              </View>
              <View style={[styles.tableCol, styles.colAmount]}>
                <Text> </Text>
              </View>
            </View>
          ))}
          
          {/* Total row */}
          <View style={styles.tableRow}>
            <View style={[styles.tableCol, { width: '85%' }]}>
              <Text style={{ fontWeight: 'bold', textAlign: 'right' }}>TOTAL BEFORE TAX</Text>
            </View>
            <View style={[styles.tableCol, styles.colAmount]}>
              <Text style={{ fontWeight: 'bold' }}>{subtotal.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Bottom Section - Optimized for space */}
        <View style={{ flexDirection: 'row', marginTop: 5 }}>
          {/* Left Column - Amount in words & Bank details */}
          <View style={{ width: '50%', paddingRight: 5 }}>
            <Text style={{ fontWeight: 'bold', marginBottom: 2 }}>Total Invoice amount in words</Text>
            <Text style={styles.amountWords}>{amountInWords}</Text>
            
            <View style={styles.bankDetails}>
              <Text style={{ fontWeight: 'bold', fontSize: 9 }}>Bank Details:</Text>
              <View style={styles.bankItem}>
                <Text style={{ fontSize: 9 }}>Bank Name: FEDERAL BANK</Text>
              </View>
              <View style={styles.bankItem}>
                <Text style={{ fontSize: 9 }}>Bank A/c No: 23580200000820</Text>
              </View>
              <View style={styles.bankItem}>
                <Text style={{ fontSize: 9 }}>Bank Branch IFSC Code: FDRL0002358</Text>
              </View>
            </View>
            <Text style={styles.termsTitle}>Terms and Conditions:</Text>
            <View style={styles.termItem}>
              <Text style={{ fontSize: 8 }}>Interest at 24% will be charged on bills unpaid after 30 days.</Text>
            </View>
            <View style={styles.termItem}>
              <Text style={{ fontSize: 8 }}>Subject to Salem Jurisdiction</Text>
            </View>
            <View style={styles.termItem}>
              <Text style={{ fontSize: 8 }}>Goods are carefully counted and packed.</Text>
            </View>
            <View style={styles.termItem}>
              <Text style={{ fontSize: 8 }}>We accept no responsible for any loss or damage in transit.</Text>
            </View>
          </View>
          
          {/* Right Column - Tax details & Signature */}
          <View style={{ width: '50%', paddingLeft: 5 }}>
            <View style={styles.table}>
              <View style={styles.tableRow}>
                <View style={[styles.tableCol, { width: '70%' }]}>
                  <Text>Add: CGST - {cgstRate}%</Text>
                </View>
                <View style={[styles.tableCol, { width: '30%' }]}>
                  <Text style={{ textAlign: 'right' }}>{cgstAmount.toFixed(2)}</Text>
                </View>
              </View>
              <View style={styles.tableRow}>
                <View style={[styles.tableCol, { width: '70%' }]}>
                  <Text>Add: SGST - {sgstRate}%</Text>
                </View>
                <View style={[styles.tableCol, { width: '30%' }]}>
                  <Text style={{ textAlign: 'right' }}>{sgstAmount.toFixed(2)}</Text>
                </View>
              </View>
              <View style={styles.tableRow}>
                <View style={[styles.tableCol, { width: '70%' }]}>
                  <Text>Add: IGST - 0%</Text>
                </View>
                <View style={[styles.tableCol, { width: '30%' }]}>
                  <Text style={{ textAlign: 'right' }}>0.00</Text>
                </View>
              </View>
              <View style={styles.tableRow}>
                <View style={[styles.tableCol, { width: '70%' }]}>
                  <Text>Total Tax Amount</Text>
                </View>
                <View style={[styles.tableCol, { width: '30%' }]}>
                  <Text style={{ textAlign: 'right' }}>{(cgstAmount + sgstAmount).toFixed(2)}</Text>
                </View>
              </View>
              <View style={styles.tableRow}>
                <View style={[styles.tableCol, { width: '70%' }]}>
                  <Text>Round Off {roundOff >= 0 ? '+' : '-'}</Text>
                </View>
                <View style={[styles.tableCol, { width: '30%' }]}>
                  <Text style={{ textAlign: 'right' }}>{Math.abs(roundOff).toFixed(2)}</Text>
                </View>
              </View>
              <View style={styles.tableRow}>
                <View style={[styles.tableCol, { width: '70%', fontWeight: 'bold' }]}>
                  <Text>Total Amount After Tax</Text>
                </View>
                <View style={[styles.tableCol, { width: '30%' }]}>
                  <Text style={{ textAlign: 'right', fontWeight: 'bold' }}>{grandTotal.toFixed(2)}</Text>
                </View>
              </View>
            </View>
            
            {/* Signature Section */}
            <View style={styles.signature}>
              <Text style={{ fontSize: 9 }}>Certified that the particulars given above are true and correct</Text>
              <Text style={{ fontWeight: 'bold', fontSize: 9 }}>For MEENA TRADERS</Text>
              <View style={{ marginTop: 20 }}>
                {/* Updated signature image handling */}
                {signatureImage ? (
                  <Image
                    src={signatureImage}
                    style={{ width: 150, height: 60 }}
                  />
                ) : (
                  <View style={styles.signatureLine} />
                )}
                <Text style={{ fontSize: 15, textAlign: 'center' }}>Authorised Signatory</Text>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

function InvoiceTemplate() {
  const [invoiceData, setInvoiceData] = useState(null);
  const [signatureImage, setSignatureImage] = useState(null);
  const [companyLogo, setCompanyLogo] = useState(null);
  const navigate = useNavigate();
  const invoiceRef = useRef(null);

  useEffect(() => {
    // Get the invoice data from localStorage
    const data = localStorage.getItem('invoiceData');
    if (data) {
      const parsedData = JSON.parse(data);
      setInvoiceData(parsedData);
      
      // Try to get signature from localStorage if it exists
      const savedSignature = localStorage.getItem('signatureImage');
      if (savedSignature) {
        setSignatureImage(savedSignature);
      }
      
      // Try to get logo from localStorage if it exists
      const savedLogo = localStorage.getItem('companyLogo');
      if (savedLogo) {
        setCompanyLogo(savedLogo);
      }
    } else {
      // Redirect back if no data
      alert('No invoice data found!');
      navigate('/');
    }
  }, [navigate]);
  
  // Function to handle company logo upload
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Image = event.target.result;
        setCompanyLogo(base64Image);
        localStorage.setItem('companyLogo', base64Image);
      };
      reader.readAsDataURL(file);
    }
  };

  const printInvoice = () => {
    window.print();
  };

  // Function to handle signature upload
  const handleSignatureUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Image = event.target.result;
        setSignatureImage(base64Image);
        localStorage.setItem('signatureImage', base64Image);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!invoiceData) {
    return (
      <Container className="my-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading invoice data...</p>
      </Container>
    );
  }
  
  // Update invoiceData with signature for PDF generation
  const invoiceDataWithImages = {
    ...invoiceData,
    signatureImage: signatureImage,
    companyLogo: companyLogo
  };
  
  const {
    customerName,
    customerAddress,
    customerGstin,
    customerState,
    customerStateCode,
    
    invoiceNumber,
    invoiceDate,
    
    items,
    
    cgstRate,
    sgstRate,
    subtotal,
    cgstAmount,
    sgstAmount,
    roundOff,
    grandTotal,
    
    amountInWords
  } = invoiceData;
  
  return (
    <Container className="p-0">
      {/* Controls for print and download - outside the printable area */}
      <div className="d-flex justify-content-center my-3 print-hide">
        <Button variant="primary" onClick={printInvoice} className="me-2">Print Invoice</Button>
        <PDFDownloadLink 
          document={<InvoicePDF invoiceData={invoiceDataWithImages} />} 
          fileName={`Invoice-${invoiceData?.invoiceNumber || 'download'}.pdf`}
          className="btn btn-success me-2"
          style={{
            textDecoration: 'none',
            color: 'white'
          }}
        >
          {({ loading }) =>
            loading ? 'Generating PDF...' : 'Download PDF'
          }
        </PDFDownloadLink>
        <Button variant="secondary" onClick={() => navigate('/')} className="me-2">Back to Editor</Button>
        
        {/* Signature upload button */}
        <div className="btn btn-info btn-file position-relative me-2">
          {signatureImage ? "Change Signature" : "Add Signature"}
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleSignatureUpload} 
            style={{ 
              position: 'absolute', 
              opacity: 0, 
              top: 0, 
              left: 0, 
              width: '100%', 
              height: '100%', 
              cursor: 'pointer' 
            }} 
          />
        </div>
        
        {/* Logo upload button */}
        <div className="btn btn-warning btn-file position-relative">
          {companyLogo ? "Change Logo" : "Add Logo"}
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleLogoUpload} 
            style={{ 
              position: 'absolute', 
              opacity: 0, 
              top: 0, 
              left: 0, 
              width: '100%', 
              height: '100%', 
              cursor: 'pointer' 
            }}
          />
        </div>
      </div>
      
      {/* A4 sized invoice template */}
      <div 
        ref={invoiceRef} 
        className="mx-auto border p-4" 
        id="printableInvoice"
        style={{
          width: '210mm',
          minHeight: '297mm',
          backgroundColor: 'white',
          boxShadow: '0 0 10px rgba(0,0,0,0.1)',
          position: 'relative',
          overflow: 'visible'
        }}
      >
         {/* Header with Logo */}
         <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-3">
          <div className="d-flex align-items-center">
            {/* Logo in HTML version */}
            {companyLogo && (
              <img 
                src={companyLogo} 
                alt="Company Logo" 
                style={{ 
                  width: '80px', 
                  height: '80px', 
                  marginRight: '15px',
                  objectFit: 'contain'
                }} 
              />
            )}
            
            {/* Company info - centered text */}
            <div className="text-center">
              <h2 className="text-primary mb-0">{invoiceData.companyName || "MEENA TRADERS"}</h2>
              <p className="fw-bold mb-0">{invoiceData.companyTagline || "YARN & WARP TRADERS"}</p>
              {(invoiceData.companyAddress || "Ground Floor, 56/8 Mu Su Thottannan Kadu,\nKarungalpatti Main Road, Gugai, SALEM - 636 006.").split('\n').map((line, i) => (
                <p key={i} className="mb-0">{line}</p>
              ))}
            </div>
          </div>
          <div>
            <h4 className="border border-dark p-2 text-center">TAX INVOICE</h4>
            <p className="mb-0">Cell: {invoiceData.companyPhone || "63803 86768"}</p>
          </div>
        </div>
        
        <Row className="mb-3">
          <Col md={6}>
            <p className="mb-1"><strong>GSTIN:</strong> {invoiceData.companyGstin || "33RVLPS4153P1ZG"}</p>
            <div className="d-flex">
              <p className="mb-1 me-4"><strong>Reverse Charge:</strong> Yes  / No </p>
              <p className="mb-1"><strong>State:</strong> {invoiceData.companyState || "Tamilnadu"}</p>
            </div>
            <p className="mb-1"><strong>State Code:</strong> {invoiceData.companyStateCode || "33"}</p>
          </Col>
          <Col md={6} className="text-end">
            <p className="mb-1"><strong>Invoice No:</strong> {invoiceNumber}</p>
            <p className="mb-1"><strong>Invoice Date:</strong> {invoiceDate}</p>
          </Col>
        </Row>
        <Row className="mb-3">
          <Col md={6}>
            <Card className="h-100">
              <Card.Header className="bg-light">Details of Receiver / Billed to:</Card.Header>
              <Card.Body>
                <p className="mb-1"><strong>Name:</strong> {customerName}</p>
                <p className="mb-1"><strong>Address:</strong> {customerAddress}</p>
                <p className="mb-1"><strong>GSTIN:</strong> {customerGstin}</p>
                <p className="mb-1"><strong>State:</strong> {customerState}</p>
                <p className="mb-0"><strong>State Code:</strong> {customerStateCode}</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="h-100">
              <Card.Header className="bg-light">Details of Consignee / Shipped to:</Card.Header>
              <Card.Body>
                <p className="mb-1"><strong>Name:</strong></p>
                <p className="mb-1"><strong>Address:</strong></p>
                <p className="mb-1"><strong>GSTIN:</strong></p>
                <p className="mb-1"><strong>State:</strong></p>
                <p className="mb-0"><strong>State Code:</strong></p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        
        <Table bordered responsive className="mb-3">
          <thead>
            <tr>
              <th>S. No.</th>
              <th>Product Description</th>
              <th>HSN Code</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>Amount Rs.</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id}>
                <td>{index + 1}</td>
                <td>{item.description} {item.weight ? `(${item.weight})` : ''}</td>
                <td>{item.hsnCode}</td>
                <td>{item.quantity}</td>
                <td>₹{item.rate.toFixed(2)}</td>
                <td>₹{item.amount.toFixed(2)}</td>
              </tr>
            ))}
            {/* Add empty rows to maintain consistent layout */}
            {Array.from({ length: Math.max(0, 8 - items.length) }, (_, i) => (
              <tr key={`empty-${i}`}>
                <td>&nbsp;</td>012
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
            ))}
            <tr>
              <th colSpan={5} className="text-end">TOTAL BEFORE TAX</th>
              <th>₹{subtotal.toFixed(2)}</th>
            </tr>
          </tbody>
        </Table>
        
        <Row className="mb-3">
          <Col md={6}>
            <Card>
              <Card.Body>
                <h6>Total Invoice amount in words</h6>
                <p className="fst-arial border-bottom pb-2">{amountInWords}</p>
                
                <div className="mt-4">
                  <h6>Bank Details:</h6>
                  <p className="mb-1 border-bottom pb-2"><strong>Bank Name:</strong> FEDERAL BANK</p>
                  <p className="mb-1 border-bottom pb-2"><strong>Bank A/c No:</strong> 23580200000820</p>
                  <p className="mb-1 border-bottom pb-2"><strong>Bank Branch IFSC Code:</strong> FDRL0002358</p>
                  
                  <h6 className="mt-3">Terms and Conditions:</h6>
                  <p className="mb-1 border-bottom pb-2">Interest at 24% will be charged on bills unpaid after 30 days.</p>
                  <p className="mb-1 border-bottom pb-2">Subject to Salem Jurisdiction</p>
                  <p className="mb-1 border-bottom pb-2">Goods are carefully counted and packed.</p>
                  <p className="mb-1 border-bottom pb-2">We accept no responsible for any loss or damage in transit.</p>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card>
              <Card.Body>
                <Table bordered>
                  <tbody>
                    <tr>
                      <td>Add: CGST - {cgstRate}%</td>
                      <td className="text-end">₹{cgstAmount.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td>Add: SGST - {sgstRate}%</td>
                      <td className="text-end">₹{sgstAmount.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td>Add: IGST - 0%</td>
                      <td className="text-end">₹0.00</td>
                    </tr>
                    <tr>
                      <td>Total Tax Amount</td>
                      <td className="text-end">₹{(cgstAmount + sgstAmount).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td>Round Off {roundOff >= 0 ? '+' : '-'}</td>
                      <td className="text-end">₹{Math.abs(roundOff).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <th>Total Amount After Tax</th>
                      <th className="text-end">₹{grandTotal.toFixed(2)}</th>
                    </tr>
                  </tbody>
                </Table>
                
                <div className="mt-5 text-center">
                </div>
                  <p>Certified that the particulars given above are true and correct</p>
                  <p className="fw-bold">For MEENA TRADERS</p>

                  <div className="mt-3 mb-2">
  {/* Updated signature image handling */}
  {signatureImage ? (
    <div style={{ textAlign: 'center' }}>
      <img 
        src={signatureImage} 
        alt="Authorised Signatory" 
        style={{ height: '60px', maxWidth: '200px', display: 'block', margin: '0 auto 5px' }}
      />
      <p className="mb-0">Authorised Signatory</p>
    </div>
  ) : (
    <div style={{ textAlign: 'center' }}>
      <div style={{ width: '200px', borderBottom: '1px solid black', margin: '0 auto 10px auto' }}></div>
      <p className="mb-0">Authorised Signatory</p>
    </div>
  )}
</div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
      
      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
            font-size: 12px;
          }
          .print-hide {
            display: none !important;
          }
          #printableInvoice {
            width: 100% !important;
            height: auto !important;
            box-shadow: none !important;
            border: none !important;
          }
          @page {
            size: A4;
            margin: 10mm;
          }
        }
        
        /* Style for file input button */
        .btn-file {
          overflow: hidden;
        }
      `}</style>
    </Container>
  );
}

export default InvoiceTemplate;