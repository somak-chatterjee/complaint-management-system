import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import FileDropzone from '../../components/FileDropzone';
import { fileUploaded, messageAdded } from './aiAssistantSlice';
import { useExtractionSocket } from './useExtractionSocket';

export default function AIAssistantPanel() {
  const dispatch = useDispatch();
  const { uploadedFileName, extractionProgress, extractionStatus, messages } = useSelector(
    (state) => state.aiAssistant
  );
  const [showPasteBox, setShowPasteBox] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [chatInput, setChatInput] = useState('');

  const { startExtractionFromFile, startExtractionFromText } = useExtractionSocket();

  const handleFileSelected = (file) => {
    dispatch(fileUploaded(file.name));
    startExtractionFromFile(file);
  };

  const handlePasteSubmit = () => {
    if (!pastedText.trim()) return;
    dispatch(fileUploaded('Pasted text'));
    startExtractionFromText(pastedText);
    setShowPasteBox(false);
    setPastedText('');
  };

  const handleChatSend = () => {
    if (!chatInput.trim()) return;
    dispatch(messageAdded({ role: 'user', text: chatInput }));
    setChatInput('');
    // Actual assistant reply will come from the backend chat endpoint — wired later.
  };

  return (
    <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid #eee', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600 }}>AI complaint intake assistant</h3>
        <span style={{ fontSize: '11px', background: '#eef1ff', color: '#4f5bd5', padding: '2px 8px', borderRadius: '4px' }}>
          BETA
        </span>
      </div>

      <FileDropzone onFileSelected={handleFileSelected} />

      <div style={{ textAlign: 'center', fontSize: '12px', color: '#999', margin: '16px 0' }}>OR</div>

      <button
        onClick={() => setShowPasteBox((prev) => !prev)}
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: '6px',
          border: '1px solid #d9dbe0',
          background: '#fff',
          fontSize: '14px',
          cursor: 'pointer',
        }}
      >
        Paste complaint text / email
      </button>

      {showPasteBox && (
        <div style={{ marginTop: '12px' }}>
          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            rows={5}
            placeholder="Paste complaint email or text here..."
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d9dbe0', fontFamily: 'inherit', fontSize: '14px' }}
          />
          <button
            onClick={handlePasteSubmit}
            style={{ marginTop: '8px', padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#4f8ef7', color: '#fff', cursor: 'pointer' }}
          >
            Extract from text
          </button>
        </div>
      )}

      <div style={{ fontSize: '12px', background: '#f0faf3', color: '#2f8a4e', padding: '10px 12px', borderRadius: '6px', margin: '16px 0' }}>
        Supported formats: PDF, DOCX, TXT, EML — max file size 10MB
      </div>

      {extractionStatus !== 'idle' && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#999', marginBottom: '4px' }}>
            <span>Extraction progress</span>
            <span>{extractionProgress}%</span>
          </div>
          <div style={{ height: '6px', background: '#eee', borderRadius: '3px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${extractionProgress}%`,
                height: '100%',
                background: '#4f8ef7',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          <p style={{ fontSize: '12px', color: '#999', marginTop: '6px' }}>
            {extractionStatus === 'extracting'
              ? `Analyzing ${uploadedFileName}...`
              : 'Extraction complete.'}
          </p>
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', marginBottom: '12px' }}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              background: msg.role === 'assistant' ? '#f0f6ff' : '#f5f5f5',
              padding: '10px 12px',
              borderRadius: '8px',
              marginBottom: '8px',
              fontSize: '13px',
            }}
          >
            {msg.text}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
          placeholder="Ask me anything about this complaint..."
          style={{ flex: 1, padding: '10px 12px', borderRadius: '6px', border: '1px solid #d9dbe0', fontSize: '14px' }}
        />
        <button
          onClick={handleChatSend}
          style={{ padding: '10px 16px', borderRadius: '6px', border: 'none', background: '#4f8ef7', color: '#fff', cursor: 'pointer' }}
        >
          Send
        </button>
      </div>
    </div>
  );
}