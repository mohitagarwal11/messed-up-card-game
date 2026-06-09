import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getLobbyState } from '../api/rooms';

export default function GamePage() {
  const { code } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    getLobbyState(code!)
      .then((data: any) => {
        if (data.room.status === 'waiting') {
          navigate(`/lobby/${code}`, { replace: true });
        }
      })
      .catch(() => navigate('/', { replace: true }));
  }, [code]);

  return <div className="h-full flex items-center justify-center text-neon text-2xl">GamePage</div>;
}
