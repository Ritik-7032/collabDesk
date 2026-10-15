import { Link } from "react-router-dom";
import BoardMockup from "../components/BoardMockup";
import ThemeToggle from "../components/ui/ThemeToggle";

import {
  ArrowRight,
  CheckCircle2,
  Kanban,
  Paperclip,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";

const FEATURES = [
  {
    icon: Kanban,
    title: "Instant Zero-Latency Sync",
    text: "Move a card and every teammate's screen updates in milliseconds with authenticated Socket.io rooms.",
  },
  {
    icon: Sparkles,
    title: "Gemini AI Task Breakdown",
    text: "Transform ambiguous project requirements into actionable subtask checklists in seconds.",
  },
  {
    icon: Users,
    title: "Team Collaboration & Invites",
    text: "Invite colleagues by email with owner/member access controls and live avatar presence.",
  },
  {
    icon: Paperclip,
    title: "Direct-to-S3 File Uploads",
    text: "Upload project assets directly to AWS S3 using presigned URLs with zero load on the server.",
  },
  {
    icon: Zap,
    title: "Slack Webhook Notifications",
    text: "Get automatic alerts in your Slack channels when tasks are created, moved, or marked done.",
  },
  {
    icon: ShieldCheck,
    title: "Enterprise Grade Auth",
    text: "Secure sign-in with Google OAuth 2.0, bcrypt-hashed credentials, and 15-minute password resets.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Create a workspace",
    text: "Spin up a collaborative workspace in 5 seconds with zero setup required.",
  },
  {
    n: "02",
    title: "Organize tasks & subtasks",
    text: "Map out columns, prioritize tasks, assign owners, and let AI generate subtasks.",
  },
  {
    n: "03",
    title: "Ship together live",
    text: "Watch work flow across the board in real time while alerts post straight to Slack.",
  },
];

function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5 group">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-white font-bold text-xs shadow-sm transition-transform group-hover:scale-105">
            CD
          </span>
          <span className="font-semibold text-sm tracking-tight text-text">
            CollabDesk
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-xs font-medium text-muted md:flex">
          <a href="#features" className="hover:text-text transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-text transition-colors">How it works</a>
          <a href="#pricing" className="hover:text-text transition-colors">Pricing</a>
        </nav>

        <div className="flex items-center gap-2.5">
          <ThemeToggle />
          <Link
            to="/login"
            className="rounded-xl px-3.5 py-2 text-xs font-medium text-muted hover:text-text hover:bg-elevated transition-colors"
          >
            Sign in
          </Link>
          <Link
            to="/signup"
            className="inline-flex items-center justify-center rounded-xl bg-primary hover:bg-primary/90 text-white px-4 py-2 text-xs font-medium shadow-sm transition-all active:scale-95"
          >
            Get started free
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
      {/* Background Soft Glow (Restricted strictly to Hero) */}
      <div
        className="pointer-events-none absolute left-1/2 -top-40 -translate-x-1/2 h-[500px] w-[800px] rounded-full opacity-15 dark:opacity-20 blur-[120px]"
        style={{ background: "radial-gradient(circle, #8B5CF6 0%, #22D3EE 60%, transparent 80%)" }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center mb-12 sm:mb-16">
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-elevated/70 px-3.5 py-1.5 text-xs font-medium text-text mb-6 shadow-subtle">
            <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-muted">Real-Time Team Kanban +</span>
            <span className="ai-gradient-text font-semibold">Gemini AI</span>
          </div>

          {/* Hero Headline with isolated gradient accent */}
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-text leading-[1.1] mb-6">
            Organize team velocity,{" "}
            <span className="ai-gradient-text">without the friction.</span>
          </h1>

          <p className="max-w-xl mx-auto text-base sm:text-lg text-muted leading-relaxed mb-8">
            CollabDesk delivers real-time boards designed for focused teams — equipped with
            Google Gemini AI to break down complex tasks into executable checklists.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-white px-6 py-3 text-sm font-semibold shadow-card transition-all active:scale-95"
            >
              Start for free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-border bg-elevated hover:bg-surface text-text px-6 py-3 text-sm font-medium transition-all"
            >
              Sign in to board
            </Link>
          </div>

          <p className="mt-4 text-xs text-muted">
            Free forever &middot; Instant Google Sign-in &middot; No card required
          </p>
        </div>

        {/* Product Preview Mockup */}
        <div className="mx-auto max-w-5xl">
          <BoardMockup />
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="border-t border-border bg-surface/40 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto mb-16 max-w-xl text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            Features
          </span>
          <h2 className="text-3xl font-bold text-text tracking-tight mt-2">
            Engineered for modern shipping
          </h2>
          <p className="mt-3 text-sm text-muted leading-relaxed">
            Everything your team needs to stay aligned, ship on schedule, and eliminate status meetings.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="rounded-2xl border border-border bg-surface p-6 transition-all duration-200 hover:border-border/90 hover:shadow-card hover:-translate-y-0.5"
            >
              <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mb-2 text-base font-semibold text-text tracking-tight">{title}</h3>
              <p className="text-xs text-muted leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 border-t border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto mb-16 max-w-xl text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            Workflow
          </span>
          <h2 className="text-3xl font-bold text-text tracking-tight mt-2">
            Up and running in 30 seconds
          </h2>
          <p className="mt-3 text-sm text-muted">
            Three simple steps between your team and real-time clarity.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {STEPS.map((step) => (
            <div
              key={step.n}
              className="relative rounded-2xl border border-border bg-surface p-6 shadow-subtle"
            >
              <span className="font-mono text-xs font-semibold text-primary">{step.n}</span>
              <h3 className="mt-3 mb-2 text-base font-semibold text-text tracking-tight">{step.title}</h3>
              <p className="text-xs text-muted leading-relaxed">{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const PLANS = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    description: "Ideal for individual developers and small test teams.",
    features: [
      "Real-time Kanban board",
      "Socket.io live synchronization",
      "File uploads & attachments",
      "Checklists & team comments",
      "Google OAuth 2.0 sign-in",
    ],
    cta: "Get started free",
    highlight: false,
  },
  {
    name: "Pro Lifetime",
    price: "₹499",
    period: "one-time",
    description: "Unlimited power for high-velocity teams.",
    features: [
      "Everything in Free",
      "Unlimited Gemini AI subtask breakdowns",
      "Direct-to-S3 high speed storage",
      "Slack webhook channel alerts",
      "Priority WebSocket connection queue",
    ],
    cta: "Upgrade in app",
    highlight: true,
  },
];

function Pricing() {
  return (
    <section id="pricing" className="border-t border-border bg-surface/40 py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mx-auto mb-16 max-w-xl text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            Pricing
          </span>
          <h2 className="text-3xl font-bold text-text tracking-tight mt-2">
            Simple, honest pricing
          </h2>
          <p className="mt-3 text-sm text-muted">
            Start free forever. Upgrade anytime with a single lifetime payment.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 max-w-3xl mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-8 flex flex-col justify-between transition-all duration-200 ${
                plan.highlight
                  ? "border-primary/40 bg-surface shadow-card ring-1 ring-primary/20"
                  : "border-border bg-surface shadow-subtle"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-text tracking-tight">{plan.name}</h3>
                  {plan.highlight && (
                    <span className="rounded-full bg-primary/10 border border-primary/25 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
                      Popular
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-3xl font-bold tracking-tight text-text">{plan.price}</span>
                  <span className="text-xs text-muted">/ {plan.period}</span>
                </div>
                <p className="text-xs text-muted mb-6 leading-relaxed">{plan.description}</p>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-xs text-text">
                      <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                to="/signup"
                className={`w-full inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
                  plan.highlight
                    ? "bg-primary hover:bg-primary/90 text-white shadow-sm"
                    : "border border-border bg-elevated hover:bg-surface text-text"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-surface py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary text-white font-bold text-[10px]">
            CD
          </span>
          <span className="font-semibold text-xs tracking-tight text-text">CollabDesk</span>
          <span className="text-xs text-muted">&middot; Real-Time Kanban &amp; AI</span>
        </div>
        <p className="text-xs text-muted">
          &copy; {new Date().getFullYear()} CollabDesk. Built with React, Tailwind &amp; Socket.io.
        </p>
      </div>
    </footer>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-bg text-text font-sans">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <Footer />
    </div>
  );
}
