import { useState, useRef } from 'react';

export default function FileDropzone({ onFileSelected }) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFileSelected(file);
  };

  const handleBrowseClick = () => inputRef.current?.click();

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onFileSelected(file);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      style={{
        border: `2px dashed ${isDragging ? '#4f8ef7' : '#d9dbe0'}`,
        borderRadius: '8px',
        padding: '28px 16px',
        textAlign: 'center',
        background: isDragging ? '#f0f6ff' : '#fafafa',
        cursor: 'pointer',
      }}
      onClick={handleBrowseClick}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.txt,.eml"
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />
      <p style={{ fontSize: '14px', color: '#555' }}>
        Drag & drop complaint document here
        <br />
        or <span style={{ color: '#4f8ef7', fontWeight: 500 }}>click to browse</span>
      </p>
    </div>
  );
}