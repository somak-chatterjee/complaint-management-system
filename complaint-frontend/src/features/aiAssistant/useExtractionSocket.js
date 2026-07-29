import { useDispatch } from 'react-redux';
import { progressUpdated, extractionFinished, messageAdded } from './aiAssistantSlice';

export function useExtractionSocket() {
  const dispatch = useDispatch();

  const simulateExtraction = () => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      dispatch(progressUpdated(Math.min(progress, 100)));
      if (progress >= 100) {
        clearInterval(interval);
        dispatch(extractionFinished());
        dispatch(messageAdded({ role: 'assistant', text: 'Extraction complete. Please review the populated fields.' }));
      }
    }, 400);
  };

  // TODO: replace both of these with real calls to the FastAPI backend
  // (upload endpoint + WebSocket connection) once the backend exists.
  const startExtractionFromFile = (file) => {
    console.log('Mock: would upload file to backend:', file.name);
    simulateExtraction();
  };

  const startExtractionFromText = (text) => {
    console.log('Mock: would send pasted text to backend:', text.slice(0, 50));
    simulateExtraction();
  };

  return { startExtractionFromFile, startExtractionFromText };
}