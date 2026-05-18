import { PublicationPage } from '../Composants/Dashboard/pages';

export default function PublicationPageWrapper() {
  return <PublicationPage onCreated={() => window.history.back()} />;
}
