import React, { memo } from 'react';
import { Table, Form, Button } from 'react-bootstrap';

const OptimizedTableRow = memo(({ 
  item, 
  index, 
  onDescriptionChange, 
  onWeightChange, 
  onHsnChange, 
  onQuantityChange, 
  onRateChange, 
  onRemove 
}) => {
  return (
    <tr>
      <td>{index + 1}</td>
      <td>
        <Form.Control
          type="text"
          placeholder="Item description"
          value={item.description}
          onChange={(e) => onDescriptionChange(item.id, e.target.value)}
        />
      </td>
      <td>
        <Form.Control
          type="text"
          placeholder="Weight"
          value={item.weight}
          onChange={(e) => onWeightChange(item.id, e.target.value)}
        />
      </td>
      <td>
        <Form.Control
          type="text"
          placeholder="HSN Code"
          value={item.hsnCode}
          onChange={(e) => onHsnChange(item.id, e.target.value)}
        />
      </td>
      <td>
        <Form.Control
          type="number"
          placeholder="Qty"
          value={item.quantity}
          onChange={(e) => onQuantityChange(item.id, parseFloat(e.target.value) || 0)}
        />
      </td>
      <td>
        <Form.Control
          type="number"
          placeholder="Rate"
          value={item.rate}
          onChange={(e) => onRateChange(item.id, parseFloat(e.target.value) || 0)}
          step="0.01"
        />
      </td>
      <td>₹{item.amount.toFixed(2)}</td>
      <td>
        <Button 
          variant="danger" 
          size="sm" 
          onClick={() => onRemove(item.id)}
          disabled={index === 0}
        >
          Remove
        </Button>
      </td>
    </tr>
  );
});

OptimizedTableRow.displayName = 'OptimizedTableRow';

const OptimizedTable = memo(({ 
  items, 
  onDescriptionChange, 
  onWeightChange, 
  onHsnChange, 
  onQuantityChange, 
  onRateChange, 
  onRemoveItem 
}) => {
  return (
    <Table striped bordered hover responsive>
      <thead>
        <tr>
          <th>Sr. No.</th>
          <th>Description</th>
          <th>Weight</th>
          <th>HSN Code</th>
          <th>Quantity</th>
          <th>Rate</th>
          <th>Amount</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, index) => (
          <OptimizedTableRow
            key={item.id}
            item={item}
            index={index}
            onDescriptionChange={onDescriptionChange}
            onWeightChange={onWeightChange}
            onHsnChange={onHsnChange}
            onQuantityChange={onQuantityChange}
            onRateChange={onRateChange}
            onRemove={onRemoveItem}
          />
        ))}
      </tbody>
    </Table>
  );
});

OptimizedTable.displayName = 'OptimizedTable';

export default OptimizedTable;