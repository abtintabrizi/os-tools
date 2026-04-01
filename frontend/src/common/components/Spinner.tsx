type SpinnerSize = "sm" | "md" | "lg";

const sizeClasses: Record<SpinnerSize, string> = {
  sm: "w-3 h-3 border",
  md: "w-5 h-5 border-2",
  lg: "w-8 h-8 border-2",
};

interface SpinnerProps {
  size?: SpinnerSize;
  primary?: string;
  secondary?: string;
}

export default function Spinner({
  size = "md",
  primary = "#888888",
  secondary = "#555555",
}: SpinnerProps) {
  return (
    <span
      className={`inline-block rounded-full animate-spin ${sizeClasses[size]}`}
      style={{ borderColor: secondary, borderTopColor: primary }}
    />
  );
}
