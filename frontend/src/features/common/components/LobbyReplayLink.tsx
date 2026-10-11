import LobbyLink from "@/features/common/components/LobbyLink";

interface LobbyReplayLinkProps {
  url: string;
  available: boolean;
  completed: boolean;
}

export default function LobbyReplayLink({
  url,
  available,
  completed,
}: LobbyReplayLinkProps) {
  return (
    <>
      <div className="h-px bg-tools-gold my-3" />
      <LobbyLink
        title="Replay"
        url={url}
        copyLabel="Copy replay link"
        actionLabel="Watch replay"
        tone="replay"
        available={available}
        helperText={`${completed ? "Draft complete" : "Draft incomplete"} \u00b7 ${available ? "Replay available" : "Replay unavailable"}`}
        onEnter={() => window.location.assign(url)}
      />
    </>
  );
}
