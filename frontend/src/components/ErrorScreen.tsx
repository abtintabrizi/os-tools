export default function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 font-mono text-[13px] text-text-muted uppercase tracking-widest">
      <span className="text-red-400">{message}</span>

      <button
        onClick={() => (window.location.href = window.location.pathname)}
        className="bg-transparent border border-border rounded-md text-text-muted px-4 py-2 font-mono text-[11px] tracking-widest cursor-pointer hover:text-text hover:border-border-bright transition"
      >
        Back to setup
      </button>
    </div>
  );
}
