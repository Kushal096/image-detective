import { useNavigate } from 'react-router-dom';
import {
  ScanSearch,
  Zap,
  Brain,
  Trophy,
  Users,
  ShieldCheck,
  Radio,
  ArrowRight,
} from 'lucide-react';
import { AppLayout } from '../layouts/AppLayout.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Badge } from '../components/ui/Badge.jsx';

const FEATURES = [
  { icon: Brain, title: 'AI Scoring', body: 'A local CLIP vision model judges every image by visual similarity. No manual scoring.' },
  { icon: Radio, title: 'Real-Time', body: 'Socket.IO keeps every device in perfect sync — timers, scores, and rounds.' },
  { icon: Zap, title: 'Instant Submit', body: 'Paste, drop, or upload. Images are compressed client-side for speed.' },
  { icon: Trophy, title: 'Live Leaderboard', body: 'Rankings animate as the AI scores submissions in real time.' },
  { icon: Users, title: 'Multiplayer Rooms', body: 'Host a room, share a code or QR, and play with dozens of detectives.' },
  { icon: ShieldCheck, title: 'Secure', body: 'Server-authoritative state, rate limiting, and validated uploads throughout.' },
];

const STEPS = [
  { n: '01', title: 'Host a room', body: 'Create a session and share the code or QR.' },
  { n: '02', title: 'Pick a target', body: 'The host selects a target image for the round.' },
  { n: '03', title: 'Hunt the web', body: 'Players find the closest matching image and submit.' },
  { n: '04', title: 'AI decides', body: 'CLIP scores each entry and the leaderboard updates live.' },
];

export const Landing = () => {
  const navigate = useNavigate();

  return (
    <AppLayout>
      {/* Hero */}
      <section className="flex flex-col items-center text-center gap-6 pt-12 pb-20">
        <Badge tone="primary">Real-time multiplayer · AI-judged</Badge>
        <h1 className="font-display text-4xl md:text-6xl leading-tight max-w-3xl">
          FIND THE <span className="text-primary drop-shadow-[0_0_12px_#00FF88]">IMAGE</span>.
          <br />
          BEAT THE <span className="text-secondary drop-shadow-[0_0_12px_#00D4FF]">NETWORK</span>.
        </h1>
        <p className="font-body text-text-secondary max-w-xl text-sm md:text-base">
          A cyberpunk investigation game where players race to find the internet image that best
          matches the target. A local AI vision model is the judge.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <Button size="lg" onClick={() => navigate('/host')}>
            <ScanSearch className="size-4" /> Host a Game
          </Button>
          <Button size="lg" variant="secondary" onClick={() => navigate('/join')}>
            Join a Game <ArrowRight className="size-4" />
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="pb-20">
        <h2 className="font-display text-xl text-center mb-8 tracking-widest text-text-secondary">
          SYSTEM CAPABILITIES
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <Card key={title} className="hover:border-primary/40 transition-colors">
              <Icon className="size-6 text-primary mb-3" aria-hidden />
              <h3 className="text-sm uppercase tracking-widest mb-2">{title}</h3>
              <p className="font-body text-xs text-text-secondary leading-relaxed">{body}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="pb-20">
        <h2 className="font-display text-xl text-center mb-8 tracking-widest text-text-secondary">
          HOW IT WORKS
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map(({ n, title, body }) => (
            <Card key={n} glow="none" className="relative overflow-hidden">
              <span className="font-display text-4xl text-elevated absolute -top-1 right-2 select-none">
                {n}
              </span>
              <h3 className="text-sm uppercase tracking-widest mb-2 text-primary">{title}</h3>
              <p className="font-body text-xs text-text-secondary leading-relaxed">{body}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="pb-16">
        <Card glow="primary" className="text-center py-10 flex flex-col items-center gap-4">
          <h2 className="font-display text-2xl">READY TO INVESTIGATE?</h2>
          <p className="font-body text-sm text-text-secondary max-w-md">
            Spin up a room in seconds. No accounts, no installs — just you and the network.
          </p>
          <Button size="lg" onClick={() => navigate('/host')}>
            Start Hosting <ArrowRight className="size-4" />
          </Button>
        </Card>
      </section>

      <footer className="border-t border-border py-6 text-center">
        <p className="font-label text-[10px] uppercase tracking-widest text-text-muted">
          Internet Detective · Built with React, Socket.IO &amp; CLIP
        </p>
      </footer>
    </AppLayout>
  );
};
