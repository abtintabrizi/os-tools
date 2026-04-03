import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";

const btnClass =
  "flex items-center gap-1.5 font-mono text-xs tracking-widest uppercase text-white/40 hover:text-white/80 transition-colors duration-150";

export function BackButton() {
  const navigate = useNavigate();
  return (
    <button className={btnClass} onClick={() => navigate(-1)}>
      <ArrowLeft size={14} />
      Back
    </button>
  );
}

export function HomeButton() {
  const navigate = useNavigate();
  return (
    <button className={btnClass} onClick={() => navigate("/")}>
      <Home size={14} />
      Home
    </button>
  );
}
