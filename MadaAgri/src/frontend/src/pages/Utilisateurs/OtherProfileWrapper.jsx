import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/ContextAuthentification';
import UserProfile from './UserProfile';

export default function OtherProfileWrapper() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    if (!id) {
      navigate('/profile', { replace: true });
      return;
    }

    if (id === currentUser?.id) {
      navigate('/profile', { replace: true });
      return;
    }

    setUserId(id);
  }, [id, currentUser, navigate]);

  if (!userId) {
    return null;
  }

  return (
    <UserProfile
      userId={userId}
      onBack={() => navigate(-1)}
      onUserProfileClick={(clickedUserId) => {
        if (clickedUserId === currentUser?.id) {
          navigate('/profile');
        } else {
          navigate(`/profile/${clickedUserId}`);
        }
      }}
    />
  );
}
