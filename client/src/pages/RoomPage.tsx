import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLobbyState } from '../api/rooms';
import type { Room } from '../../../shared/types';

export default function GamePage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);

  useEffect(() => {
    getLobbyState(code!)
      .then((data: Room) => {
        if (data.status === 'waiting') {
          navigate(`/lobby/${code}`, { replace: true });
          return;
        }
        setRoom(data);
      })
      .catch(() => navigate('/', { replace: true }));
  }, [code]);

  // if (!room) return null;
  console.log(room);

  return <div className="h-full flex items-center justify-center text-neon text-2xl">RoomPage</div>;
}
