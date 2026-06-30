import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { LogIn } from "lucide-react";
import { AppLayout } from "../../layouts/AppLayout.jsx";
import { Card, CardHeader } from "../../components/ui/Card.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { useGame } from "../../contexts/gameContext.js";
import { loadSession } from "../../utils/storage.js";

const ROOM_CODE_RE = /^[A-Z0-9]{6}$/;

/** Player entry point: enter a room code (or arrive pre-filled via QR) + name. */
export const JoinGame = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { joinRoom, restoreSession, rejoinPlayer } = useGame();

  const [code, setCode] = useState((params.get("code") ?? "").toUpperCase());
  const [name, setName] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [resuming, setResuming] = useState(true);

  // Auto-resume if a saved player session exists.
  useEffect(() => {
    const saved = loadSession({ role: "player" });
    if (saved?.code && saved?.playerId) {
      restoreSession(saved);
      rejoinPlayer().then((res) => {
        if (res?.ok) navigate("/play", { replace: true });
        else setResuming(false);
      });
    } else {
      setResuming(false);
    }
  }, [restoreSession, rejoinPlayer, navigate]);

  const validate = () => {
    const next = {};
    if (!ROOM_CODE_RE.test(code.trim().toUpperCase()))
      next.code = "Enter a valid 6-character code";
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 20)
      next.name = "Name must be 2–20 characters";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    const res = await joinRoom({
      code: code.trim().toUpperCase(),
      name: name.trim(),
    });
    setSubmitting(false);
    if (res?.ok) navigate("/play");
  };

  if (resuming) {
    return (
      <AppLayout>
        <div className="max-w-md mx-auto pt-10 text-center">
          <p className="font-label uppercase tracking-widest text-text-secondary text-sm">
            Restoring your session…
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-md mx-auto pt-10">
        <Card glow="secondary" className="animate-fade-in">
          <CardHeader
            title="Join Investigation"
            subtitle="Enter your room code to connect"
            icon={LogIn}
          />
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <Input
              label="Room Code"
              value={code}
              onChange={(e) =>
                setCode(e.target.value.toUpperCase().slice(0, 6))
              }
              placeholder="K7QP2M"
              autoCapitalize="characters"
              autoComplete="off"
              maxLength={6}
              error={errors.code}
              className="tracking-[0.4em] text-center font-display text-lg"
            />
            <Input
              label="Display Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Detective_47"
              maxLength={20}
              error={errors.name}
            />
            <Button
              type="submit"
              size="lg"
              loading={submitting}
              className="w-full"
            >
              Connect
            </Button>
            <p className="font-body text-xs text-text-muted text-center">
              Lost connection? Re-enter the same room code and display name to
              resume.
            </p>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
};
