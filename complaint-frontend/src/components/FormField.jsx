import { useDispatch } from 'react-redux';
import { setFieldFromUser } from '../features/complaintForm/complaintFormSlice';

const baseInputStyle = (field, needsReview, type = 'text') => ({
  width: '100%',
  padding: '10px 12px',
  borderRadius: '6px',
  border: needsReview
    ? '1px solid #e0a030'
    : field.source === 'ai' ? '1px solid #4f8ef7' : '1px solid #d9dbe0',
  background: needsReview
    ? '#fff8ec'
    : field.source === 'ai' ? '#f0f6ff' : '#fafafa',
  fontSize: '14px',
  fontFamily: 'inherit',
  ...(type === 'textarea' && { resize: 'vertical' }),
  ...(type === 'select' && { color: field.value ? '#1a1a1a' : '#8a8a8a' }),
});

export default function FormField({ name, label, field, type = 'text', options = [], needsReview = false }) {
  const dispatch = useDispatch();
  const handleChange = (e) => dispatch(setFieldFromUser({ field: name, value: e.target.value }));

  const renderInput = () => {
    if (type === 'date' && needsReview) {
      return (
        <input
          type="text"
          value={field.value || ''}
          placeholder="Awaiting AI extraction..."
          onChange={handleChange}
          style={baseInputStyle(field, needsReview)}
        />
      );
    }

    if (type === 'textarea') {
      return (
        <textarea
          value={field.value}
          placeholder="Awaiting AI extraction..."
          onChange={handleChange}
          rows={4}
          style={{ ...baseInputStyle(field, needsReview), resize: 'vertical' }}
        />
      );
    }

    if (type === 'select') {
      return (
        <select
          value={field.value}
          onChange={handleChange}
          style={{ ...baseInputStyle(field, needsReview), color: field.value ? '#1a1a1a' : '#8a8a8a' }}
        >
          <option value="" disabled>
            Awaiting AI extraction...
          </option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    }

    // default: text, date, number, etc.
    return (
      <input
        type={type}
        value={field.value}
        placeholder="Awaiting AI extraction..."
        onChange={handleChange}
        style={baseInputStyle(field, needsReview)}
      />
    );
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
        {label}
      </label>
      {renderInput()}
      {needsReview && (
        <span style={{ fontSize: '11px', color: '#c07a00' }}>
          ⚠ AI could not confirm exact date — please verify
        </span>
      )}
      {!needsReview && field.source === 'ai' && field.confidence !== null && (
        <span style={{ fontSize: '11px', color: '#4f8ef7' }}>
          AI extracted · {Math.round(field.confidence * 100)}% confidence
        </span>
      )}
    </div>
  );
}