import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  uploadedFileName: null,
  extractionProgress: 0, // 0-100
  extractionStatus: 'idle', // idle | extracting | done | error
  messages: [
    { role: 'assistant', text: 'Upload a complaint document or paste text above. I will automatically extract the details and populate the form for you.' },
  ],
};

const aiAssistantSlice = createSlice({
  name: 'aiAssistant',
  initialState,
  reducers: {
    fileUploaded(state, action) {
      state.uploadedFileName = action.payload;
      state.extractionStatus = 'extracting';
      state.extractionProgress = 0;
    },
    progressUpdated(state, action) {
      state.extractionProgress = action.payload;
    },
    extractionFinished(state) {
      state.extractionStatus = 'done';
      state.extractionProgress = 100;
    },
    messageAdded(state, action) {
      state.messages.push(action.payload);
    },
  },
});

export const { fileUploaded, progressUpdated, extractionFinished, messageAdded } = aiAssistantSlice.actions;
export default aiAssistantSlice.reducer;