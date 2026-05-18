import { useNavigate } from 'react-router-dom';
import { FeedPage } from '../Composants/Dashboard/pages';

export default function FeedPageWrapper() {
  const navigate = useNavigate();

  const handleUserProfileClick = (userId) => {
    navigate(`/profile/${userId}`);
  };

  return <FeedPage onUserProfileClick={handleUserProfileClick} />;
}
