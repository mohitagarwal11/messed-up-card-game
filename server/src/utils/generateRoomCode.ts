export default function generateRoomCode(length = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}
