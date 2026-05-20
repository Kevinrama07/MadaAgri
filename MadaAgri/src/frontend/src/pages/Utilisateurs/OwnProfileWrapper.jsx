import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/ContextAuthentification';
import ProfilePage from './ProfilePage';

export default function OwnProfileWrapper() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  return <ProfilePage user={user} onUserProfileClick={(userId) => navigate(`/profile/${userId}`)} />;
}
