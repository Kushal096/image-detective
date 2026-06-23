import { Users, Loader2 } from "lucide-react";
import { Card, CardHeader } from "../../../components/ui/Card.jsx";
import { Badge } from "../../../components/ui/Badge.jsx";

/** Player waiting room shown before the first round starts. */
export const Lobby = ({ room, playerId }) => (
  <div className="max-w-md mx-auto pt-8 flex flex-col gap-4 animate-fade-in">
    <Card glow="secondary" className="text-center">
      <p className="font-label text-[10px] uppercase tracking-widest text-text-muted mb-1">
        Connected to room
      </p>
      <p className="font-display text-3xl tracking-[0.3em] text-primary">
        {room.code}
      </p>
      <div className="mt-3 flex justify-center gap-2">
        <Badge tone="primary">In Lobby</Badge>
        {room.currentRound > 1 && (
          <Badge tone="secondary">Round {room.currentRound}</Badge>
        )}
      </div>
    </Card>

    <Card className="flex flex-col items-center gap-3 py-8">
      <Loader2
        className="size-8 text-secondary animate-spin-slow"
        aria-hidden
      />
      <p className="font-body text-sm text-text-secondary text-center">
        Waiting for the host to start the investigation…
      </p>
    </Card>

    <Card>
      <CardHeader
        title="Detectives"
        subtitle={`${room.players.length} in the room`}
        icon={Users}
      />
      <ul className="flex flex-wrap gap-2">
        {room.players.map((p) => (
          <li
            key={p.id}
            className={`font-body text-xs px-2.5 py-1 rounded-xs border ${
              p.id === playerId
                ? "border-secondary/60 bg-secondary/10 text-secondary"
                : "border-border bg-elevated text-text-secondary"
            }`}
          >
            {p.name}
            {p.id === playerId && " (you)"}
          </li>
        ))}
      </ul>
    </Card>
  </div>
);
