import { configureStore } from '@reduxjs/toolkit';
import complaintFormReducer from '../features/complaintForm/complaintFormSlice';
import aiAssistantReducer from '../features/aiAssistant/aiAssistantSlice';

export const store = configureStore({
  reducer: {
    complaintForm: complaintFormReducer,
    aiAssistant: aiAssistantReducer,
  },
});