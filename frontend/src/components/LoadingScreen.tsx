export default function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center font-mono text-[12px] tracking-[0.15em] text-text-muted uppercase">
      {message}
    </div>
  );
}
