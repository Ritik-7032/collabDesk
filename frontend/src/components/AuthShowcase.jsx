import { Kanban, Sparkles, Users } from "lucide-react";

const FEATURES = [
  { icon: Kanban, text: "Live Kanban boards synced instantly via WebSockets" },
  { icon: Sparkles, text: "Google Gemini AI converts messy notes into checklists" },
  { icon: Users, text: "Shared team workspaces, member roles and Slack alerts" },
];

export default function AuthShowcase() {
  return (
    <div className="relative hidden overflow-hidden bg-surface border-r border-border lg:flex lg:w-[48%] lg:flex-col lg:justify-between p-10 xl:p-14 select-none">
      {/* Background Soft Glow */}
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full opacity-10 dark:opacity-20 blur-[100px]"
        style={{ background: "radial-gradient(circle, #8B5CF6 0%, #22D3EE 70%)" }}
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 rounded-full opacity-10 dark:opacity-15 blur-[100px]"
        style={{ background: "radial-gradient(circle, #4F46E5 0%, transparent 70%)" }}
      />

      {/* Top Logo */}
      <div className="relative flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white font-bold text-sm shadow-sm">
          CD
        </span>
        <span className="font-semibold text-base tracking-tight text-text">CollabDesk</span>
      </div>

      {/* Middle Headline & Feature points */}
      <div className="relative max-w-md">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-elevated px-3 py-1 text-xs font-mono text-primary mb-5 shadow-subtle">
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
          <span>COLLABDESK V2.0 &middot; PRODUCTION</span>
        </div>

        <h2 className="text-3xl xl:text-4xl font-bold text-text tracking-tight leading-tight mb-4">
          The real-time board built for high-velocity teams.
        </h2>

        <p className="text-muted text-sm leading-relaxed mb-8">
          Manage sprint tasks, assign owners, upload assets directly to S3, and let Gemini AI break large projects into actionable subtasks.
        </p>

        <ul className="space-y-3.5">
          {FEATURES.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-xs text-text">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-elevated border border-border text-primary">
                <Icon className="h-4 w-4" />
              </span>
              <span className="leading-snug">{text}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer Note */}
      <div className="relative flex items-center justify-between text-xs text-muted font-mono pt-6 border-t border-border/60">
        <span>&copy; {new Date().getFullYear()} CollabDesk</span>
        <span>Linear &middot; Notion Inspired</span>
      </div>
    </div>
  );
}
