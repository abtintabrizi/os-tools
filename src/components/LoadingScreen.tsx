export default function LoadingScreen({ message }: { message: string }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-mono)",
        fontSize: "12px",
        letterSpacing: "0.15em",
        color: "var(--text-muted)",
        textTransform: "uppercase",
      }}
    >
      {message}
    </div>
  );
}
