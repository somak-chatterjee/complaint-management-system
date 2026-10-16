import { useDispatch } from 'react-redux';
import { progressUpdated, extractionFinished, messageAdded, sourceTextSet } from './aiAssistantSlice';
import { setFieldFromAI } from '../complaintForm/complaintFormSlice';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const WS_URL = API_BASE.replace(/^http/, 'ws') + '/extraction/ws';

// Maps backend field keys to Redux dispatch calls. Text fields carry
// {value, confidence}; severity/priority are plain strings.
const TEXT_FIELD_KEYS = [
  'complaintSource', 'customerName', 'productName', 'productStrength',
  'batchNumber', 'manufacturingDate', 'expiryDate', 'quantityAffected',
  'complaintType', 'complaintDate', 'complaintDescription',
];

function dispatchExtractionResult(dispatch, result) {
  TEXT_FIELD_KEYS.forEach((key) => {
    const field = result[key];
    if (field && field.value !== null && field.value !== undefined) {
      dispatch(setFieldFromAI({
        field: key,
        value: field.value,
        confidence: field.confidence,
        needsReview: field.needs_review ?? false,
      }));
    }
  });

  if (result.initialSeverity) {
    dispatch(setFieldFromAI({ field: 'initialSeverity', value: result.initialSeverity, confidence: null }));
  }
  if (result.priority) {
    dispatch(setFieldFromAI({ field: 'priority', value: result.priority, confidence: null }));
  }
}

function runExtraction(dispatch, rawText) {
  dispatch(sourceTextSet(rawText));
  const socket = new WebSocket(WS_URL);

  socket.onopen = () => {
    socket.send(JSON.stringify({ raw_text: rawText }));
  };

  socket.onmessage = (event) => {
    console.log('WS message received:', event.data);
    const message = JSON.parse(event.data);

    if (message.status === 'progress') {
      dispatch(progressUpdated(message.progress));
    } else if (message.status === 'complete') {
      dispatchExtractionResult(dispatch, message.result);
      dispatch(extractionFinished());
    } else if (message.status === 'error') {
      dispatch(messageAdded({ role: 'assistant', text: `Extraction failed: ${message.error}` }));
      socket.close();
    }
  };

  socket.onerror = () => {
    dispatch(messageAdded({ role: 'assistant', text: 'Connection to the extraction service failed. Is the backend running?' }));
  };
}

export function useExtractionSocket() {
  const dispatch = useDispatch();

  const startExtractionFromFile = async (file) => {
    // Upload the file to get parsed raw text first, then extract.
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE}/extraction/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const err = await response.json();
        dispatch(messageAdded({ role: 'assistant', text: `Upload failed: ${err.detail}` }));
        return;
      }
      const data = await response.json();
      runExtraction(dispatch, data.raw_text);
    } catch (e) {
      console.error('Upload failed:', e);
      dispatch(messageAdded({ role: 'assistant', text: 'Could not reach the backend to upload the file.' }));
    }
  };

  const startExtractionFromText = (text) => {
    runExtraction(dispatch, text);
  };

  return { startExtractionFromFile, startExtractionFromText };
}