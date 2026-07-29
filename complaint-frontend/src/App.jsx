import ComplaintForm from './features/complaintForm/ComplaintForm';
import AIAssistantPanel from './features/aiAssistant/AIAssistantPanel';

export default function App() {
  return (
    <div style={{ display: 'flex', gap: '24px', padding: '24px', maxWidth: '1400px', margin: '0 auto', alignItems: 'stretch' }}>
      <div style={{ flex: 1.4, display: 'flex' }}>
        <ComplaintForm />
      </div>
      <div style={{ flex: 1, display: 'flex' }}>
        <AIAssistantPanel />
      </div>
    </div>
  );
}