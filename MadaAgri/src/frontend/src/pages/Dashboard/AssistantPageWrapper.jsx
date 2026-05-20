import { AssistantProvider } from '../../contexts/AssistantContext';
import AssistantPage from '../Composants/Assistant/AssistantPage';

export default function AssistantPageWrapper() {
  return (
    <AssistantProvider>
      <AssistantPage />
    </AssistantProvider>
  );
}
