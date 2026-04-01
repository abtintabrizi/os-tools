export default function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 font-mono text-sm uppercase tracking-widest">
      <span className="text-red-400">{message}</span>

      <button
        onClick={() => (window.location.href = window.location.pathname)}
        className="bg-transparent border border-white/7 rounded-md px-4 py-2 font-mono text-sm tracking-widest hover:border-white/15 transition"
      >
        Back to setup
      </button>
    </div>
  );
}
