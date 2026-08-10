import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import FormField from '../../components/FormField';
import { resetForm } from './complaintFormSlice';

const API_BASE = 'http://localhost:8000';

export default function ComplaintForm() {
  const dispatch = useDispatch();
  const fields = useSelector((state) => state.complaintForm.fields);
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved | error
  const [saveError, setSaveError] = useState(null);
  const [savedStatusLabel, setSavedStatusLabel] = useState('Pending Triage');

  const handleReset = () => {
    dispatch(resetForm());
    setSaveStatus('idle');
    setSaveError(null);
    setSavedStatusLabel('Pending Triage');
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    setSaveError(null);

    const payload = {
      complaintSource: fields.complaintSource.value || null,
      customerName: fields.customerName.value || null,
      productName: fields.productName.value || null,
      productStrength: fields.productStrength.value || null,
      batchNumber: fields.batchNumber.value || null,
      manufacturingDate: fields.manufacturingDate.value || null,
      expiryDate: fields.expiryDate.value || null,
      quantityAffected: fields.quantityAffected.value || null,
      complaintType: fields.complaintType.value || null,
      complaintDate: fields.complaintDate.value || null,
      complaintDescription: fields.complaintDescription.value || null,
      initialSeverity: fields.initialSeverity.value || null,
      priority: fields.priority.value || null,
      status: 'Pending Triage',
    };

    try {
      const response = await fetch(`${API_BASE}/complaints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json();
        setSaveStatus('error');
        setSaveError(err.detail || 'Save failed');
        return;
      }

      const saved = await response.json();
      setSaveStatus('saved');
      setSavedStatusLabel(saved.status);
    } catch (e) {
      setSaveStatus('error');
      setSaveError('Could not reach the backend.');
    }
  };

  return (
    <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid #eee', height: '100%', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 600 }}>Log customer complaint</h2>
          <p style={{ fontSize: '13px', color: '#888', marginBottom: '20px' }}>API & FDF quality assurance module</p>
        </div>
        <span style={{
          fontSize: '11px',
          fontWeight: 600,
          padding: '4px 10px',
          borderRadius: '4px',
          background: saveStatus === 'saved' ? '#eafaf0' : '#fff7e6',
          color: saveStatus === 'saved' ? '#2f8a4e' : '#b8860b',
          border: `1px solid ${saveStatus === 'saved' ? '#b7e4c7' : '#f0d896'}`,
        }}>
          {saveStatus === 'saved' ? savedStatusLabel : 'Pending Triage'}
        </span>
      </div>

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
        <FormField name="manufacturingDate" label="Manufacturing date" field={fields.manufacturingDate} type="date" needsReview={fields.manufacturingDate.needsReview} />
        <FormField name="expiryDate" label="Expiry date" field={fields.expiryDate} type="date" needsReview={fields.expiryDate.needsReview} />
        <FormField name="quantityAffected" label="Quantity affected" field={fields.quantityAffected} />
      </div>

      <h4 style={{ fontSize: '13px', color: '#999', marginBottom: '12px' }}>3. Complaint details</h4>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <FormField name="complaintType" label="Complaint type" field={fields.complaintType} />
        <FormField
          name="complaintDate"
          label="Complaint date"
          field={fields.complaintDate}
          type="date"
          needsReview={fields.complaintDate.needsReview}
        />
      </div>
      <div style={{ marginBottom: '24px' }}>
        <FormField name="complaintDescription" label="Detailed complaint description" field={fields.complaintDescription} type="textarea" />
      </div>

      <h4 style={{ fontSize: '13px', color: '#999', marginBottom: '12px' }}>4. Initial assessment & priority</h4>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <FormField name="initialSeverity" label="Initial severity" field={fields.initialSeverity} type="select" options={['Critical', 'Major', 'Minor']} />
        <FormField name="priority" label="Priority" field={fields.priority} type="select" options={['High', 'Medium', 'Low']} />
      </div>

      {saveStatus === 'error' && (
        <div style={{ fontSize: '13px', color: '#c0392b', background: '#fdecea', padding: '10px 12px', borderRadius: '6px', marginBottom: '16px' }}>
          {saveError}
        </div>
      )}
      {saveStatus === 'saved' && (
        <div style={{ fontSize: '13px', color: '#2f8a4e', background: '#eafaf0', padding: '10px 12px', borderRadius: '6px', marginBottom: '16px' }}>
          Complaint saved successfully.
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button
          onClick={handleReset}
          style={{ padding: '10px 20px', borderRadius: '6px', border: '1px solid #d9dbe0', background: '#fff', cursor: 'pointer', fontSize: '14px' }}
        >
          ↺ Reset Form
        </button>
        <button
          onClick={handleSave}
          disabled={saveStatus === 'saving'}
          style={{
            padding: '10px 20px',
            borderRadius: '6px',
            border: 'none',
            background: saveStatus === 'saving' ? '#a8c5f5' : '#4f8ef7',
            color: '#fff',
            cursor: saveStatus === 'saving' ? 'not-allowed' : 'pointer',
            fontSize: '14px',
          }}
        >
          {saveStatus === 'saving' ? 'Saving...' : '💾 Save Complaint'}
        </button>
      </div>
    </div>
  );
}