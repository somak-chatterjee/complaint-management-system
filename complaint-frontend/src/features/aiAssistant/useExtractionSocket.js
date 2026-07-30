import { useDispatch } from 'react-redux';
import { progressUpdated, extractionFinished, messageAdded } from './aiAssistantSlice';
import { setFieldFromAI } from '../complaintForm/complaintFormSlice';

const WS_URL = 'ws://localhost:8000/extraction/ws';

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
      console.log('Full extraction result:', message.result);

      // TEMP: force a needs_review date case to see how the UI actually handles it
      const testResult = {
        ...message.result,
        complaintDate: { value: 'early spring', confidence: 0.5, needs_review: true },
      };
      dispatchExtractionResult(dispatch, testResult);

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
      const response = await fetch('http://localhost:8000/extraction/upload', {
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
      dispatch(messageAdded({ role: 'assistant', text: 'Could not reach the backend to upload the file.' }));
    }
  };

  const startExtractionFromText = (text) => {
    runExtraction(dispatch, text);
  };

  return { startExtractionFromFile, startExtractionFromText };
}