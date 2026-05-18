import { useNavigate } from 'react-router-dom';
import { NetworkPage } from '../Composants/Dashboard/pages';

export default function NetworkPageWrapper() {
  const navigate = useNavigate();

  const handleUserProfileClick = (userId) => {
    navigate(`/profile/${userId}`);
  };

  return <NetworkPage onUserProfileClick={handleUserProfileClick} />;
}
