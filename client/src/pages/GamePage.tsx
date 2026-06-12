import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getLobbyState } from '../api/rooms';
import type { Room } from '../../../shared/types';

export default function GamePage() {
  const { code } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    getLobbyState(code!)
      .then((data: Room) => {
        if (data.status === 'waiting') {
          navigate(`/lobby/${code}`, { replace: true });
        }
      })
      .catch(() => navigate('/', { replace: true }));
  }, [code, navigate]);

  return <div className="h-full flex items-center justify-center text-neon text-2xl">GamePage</div>;
}
