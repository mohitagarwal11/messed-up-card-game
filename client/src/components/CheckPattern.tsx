export default function CheckPattern() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none opacity-[0.15] z-0"
      style={{
        backgroundImage:
          'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)',
        backgroundSize: '60px 60px',
        backgroundRepeat: 'repeat',
      }}
    />
  );
}
