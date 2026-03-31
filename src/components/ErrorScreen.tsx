export default function ErrorScreen({ message }: { message: string }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px",
        fontFamily: "var(--font-mono)",
        fontSize: "13px",
        color: "var(--text-muted)",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
      }}
    >
      <span style={{ color: "#f87171" }}>{message}</span>
      <button
        onClick={() => (window.location.href = window.location.pathname)}
        style={{
          background: "transparent",
          border: "1px solid var(--border)",
          borderRadius: "6px",
          color: "var(--text-muted)",
          padding: "8px 16px",
          fontFamily: "var(--font-mono)",
          fontSize: "11px",
          letterSpacing: "0.1em",
          cursor: "pointer",
        }}
      >
        Back to setup
      </button>
    </div>
  );
}
