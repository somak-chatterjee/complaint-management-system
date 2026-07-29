import { useSelector } from 'react-redux';
import FormField from '../../components/FormField';

export default function ComplaintForm() {
  const fields = useSelector((state) => state.complaintForm.fields);

  return (
    <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid #eee', height: '100%', width: '100%', boxSizing: 'border-box' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 600 }}>Log customer complaint</h2>
      <p style={{ fontSize: '13px', color: '#888', marginBottom: '20px' }}>API & FDF quality assurance module</p>

      <h4 style={{ fontSize: '13px', color: '#999', marginBottom: '12px' }}>1. Origin & customer details</h4>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <FormField name="complaintSource" label="Complaint source" field={fields.complaintSource} />
        <FormField name="customerName" label="Customer name" field={fields.customerName} />
      </div>

      <h4 style={{ fontSize: '13px', color: '#999', marginBottom: '12px' }}>2. Product & batch identification</h4>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <FormField name="productName" label="Product name" field={fields.productName} />
        <FormField name="productStrength" label="Product strength/grade" field={fields.productStrength} />
        <FormField name="batchNumber" label="Batch/lot number" field={fields.batchNumber} />
        <FormField name="manufacturingDate" label="Manufacturing date" field={fields.manufacturingDate} type="date" />
        <FormField name="expiryDate" label="Expiry date" field={fields.expiryDate} type="date" />
        <FormField name="quantityAffected" label="Quantity affected" field={fields.quantityAffected} />
      </div>

      <h4 style={{ fontSize: '13px', color: '#999', marginBottom: '12px' }}>3. Complaint details</h4>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <FormField name="complaintType" label="Complaint type" field={fields.complaintType} />
        <FormField name="complaintDate" label="Complaint date" field={fields.complaintDate} type="date" />
      </div>
      <div style={{ marginBottom: '24px' }}>
        <FormField name="complaintDescription" label="Detailed complaint description" field={fields.complaintDescription} type="textarea" />
      </div>

      <h4 style={{ fontSize: '13px', color: '#999', marginBottom: '12px' }}>4. Initial assessment & priority</h4>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <FormField name="initialSeverity" label="Initial severity" field={fields.initialSeverity} type="select" options={['Critical', 'Major', 'Minor']} />
        <FormField
          name="priority"
          label="Priority"
          field={fields.priority}
          type="select"
          options={["High", "Medium", "Low"]}
        />
      </div>
    </div>
  );
}