import { createSlice } from '@reduxjs/toolkit';
import { resetForm } from '../complaintForm/complaintFormSlice';

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
    sourceTextSet(state, action) {
      const last = state.messages[state.messages.length - 1];
      const hasChat = state.messages.some((m) => m.role === 'user');
      if (hasChat && !last?.divider) {
        state.messages.push({ role: 'assistant', text: 'New complaint loaded.', divider: true });
      }
      state.sourceText = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(resetForm, (state) => {
      state.extractionStatus = 'idle';
      state.extractionProgress = 0;
      state.uploadedFileName = null;
      state.sourceText = '';
      state.messages.push({
        role: 'assistant',
        text: 'Form reset. Questions from here on refer to the next complaint you load.',
        divider: true,
      });
    });
  },
});

export const { fileUploaded, progressUpdated, extractionFinished, messageAdded, sourceTextSet } = aiAssistantSlice.actions;
export default aiAssistantSlice.reducer;