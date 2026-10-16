import { API_BASE } from '../../config';
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
  const sourceText = useSelector((state) => state.aiAssistant.sourceText);
  const formFields = useSelector((state) => state.complaintForm.fields);
  const [showPasteBox, setShowPasteBox] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [chatPending, setChatPending] = useState(false);

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

  const handleChatSend = async () => {
    const text = chatInput.trim();
    if (!text || chatPending) return;

    const lastDivider = messages.map((m) => !!m.divider).lastIndexOf(true);
    const history = messages
      .slice(lastDivider + 1)
      .map((m) => ({ role: m.role, text: m.text }));
    dispatch(messageAdded({ role: 'user', text }));
    setChatInput('');
    setChatPending(true);

    const form = Object.fromEntries(
      Object.entries(formFields).map(([key, field]) => [key, field.value || null])
    );

    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history, raw_text: sourceText || null, form }),
      });

      if (!response.ok) {
        let detail = `Chat failed (${response.status})`;
        try {
          const body = await response.json();
          if (typeof body.detail === 'string') detail = body.detail;
        } catch {
          // Keep the status-based message when the response is not JSON.
        }
        dispatch(messageAdded({ role: 'assistant', text: detail }));
        return;
      }

      const data = await response.json();
      dispatch(messageAdded({ role: 'assistant', text: data.reply }));
    } catch (e) {
      console.error('Chat failed:', e);
      dispatch(messageAdded({ role: 'assistant', text: 'Could not reach the backend.' }));
    } finally {
      setChatPending(false);
    }
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
        {messages.map((msg, i) =>
          msg.divider ? (
            <div key={i} style={{ textAlign: 'center', fontSize: '11px', color: '#999', margin: '12px 0' }}>
              — {msg.text} —
            </div>
          ) : (
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
          )
        )}
        {chatPending && <div style={{ fontSize: '12px', color: '#999' }}>Assistant is thinking...</div>}
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
      <p style={{ fontSize: '11px', color: '#999', textAlign: 'center', marginTop: '8px' }}>
        AI responses may contain errors. Please verify information.
      </p>
    </div>
  );
}