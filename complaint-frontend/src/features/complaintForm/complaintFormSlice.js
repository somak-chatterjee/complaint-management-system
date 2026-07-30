import { createSlice } from '@reduxjs/toolkit';

const emptyField = () => ({ value: '', source: 'manual', confidence: null, needsReview: false });

const initialState = {
  status: 'idle', // idle | awaiting_extraction | ready
  fields: {
    complaintSource: emptyField(),
    customerName: emptyField(),
    productName: emptyField(),
    productStrength: emptyField(),
    batchNumber: emptyField(),
    manufacturingDate: emptyField(),
    expiryDate: emptyField(),
    quantityAffected: emptyField(),
    complaintType: emptyField(),
    complaintDate: emptyField(),
    complaintDescription: emptyField(),
    initialSeverity: emptyField(),
    priority: emptyField(),
  },
};

const complaintFormSlice = createSlice({
  name: 'complaintForm',
  initialState,
  reducers: {
    setFieldFromAI(state, action) {
      const { field, value, confidence, needsReview } = action.payload;
      state.fields[field] = { value, source: 'ai', confidence, needsReview: needsReview ?? false };
    },
    setFieldFromUser(state, action) {
      const { field, value } = action.payload;
      state.fields[field] = { value, source: 'manual', confidence: null, needsReview: false };
    },
    resetForm() {
      return initialState;
    },
  },
});

export const { setFieldFromAI, setFieldFromUser, resetForm } = complaintFormSlice.actions;
export default complaintFormSlice.reducer;