import { useDispatch } from 'react-redux';
import { setFieldFromUser } from '../features/complaintForm/complaintFormSlice';

const baseInputStyle = (field) => ({
  width: '100%',
  padding: '10px 12px',
  borderRadius: '6px',
  border: field.source === 'ai' ? '1px solid #4f8ef7' : '1px solid #d9dbe0',
  background: field.source === 'ai' ? '#f0f6ff' : '#fafafa',
  fontSize: '14px',
  fontFamily: 'inherit',
});

export default function FormField({ name, label, field, type = 'text', options = [] }) {
  const dispatch = useDispatch();

  const handleChange = (e) => {
    dispatch(setFieldFromUser({ field: name, value: e.target.value }));
  };

  const renderInput = () => {
    if (type === 'textarea') {
      return (
        <textarea
          value={field.value}
          placeholder="Awaiting AI extraction..."
          onChange={handleChange}
          rows={4}
          style={{ ...baseInputStyle(field), resize: 'vertical' }}
        />
      );
    }

    if (type === 'select') {
      return (
        <select
          value={field.value}
          onChange={handleChange}
          style={{ ...baseInputStyle(field), color: field.value ? '#1a1a1a' : '#8a8a8a' }}
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
        style={baseInputStyle(field)}
      />
    );
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
        {label}
      </label>
      {renderInput()}
      {field.source === 'ai' && field.confidence !== null && (
        <span style={{ fontSize: '11px', color: '#4f8ef7' }}>
          AI extracted · {Math.round(field.confidence * 100)}% confidence
        </span>
      )}
    </div>
  );
}