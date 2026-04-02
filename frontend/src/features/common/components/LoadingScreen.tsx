export default function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center font-mono text-sm tracking-widest uppercase">
      {message}
    </div>
  );
}
