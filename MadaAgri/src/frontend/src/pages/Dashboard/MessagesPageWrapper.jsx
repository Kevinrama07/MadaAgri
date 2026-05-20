import { useParams } from 'react-router-dom';
import { MessagesPage } from '../Composants/Dashboard/pages';

export default function MessagesPageWrapper() {
  const { targetUserId } = useParams();
  return <MessagesPage targetUserId={targetUserId} />;
}
