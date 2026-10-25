import { useNavigate } from "react-router-dom";

export default function ErrorScreen({ message }: { message: string }) {
  const navigate = useNavigate();

  return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 font-mono text-sm uppercase tracking-widest">
      <span className="text-red-400">{message}</span>

      <button
        onClick={() => navigate("/map-draft")}
        className="bg-transparent border border-white/7 rounded-md px-4 py-2 font-mono text-sm tracking-widest hover:border-white/15 transition"
      >
        Back to setup
      </button>
    </div>
  );
}
