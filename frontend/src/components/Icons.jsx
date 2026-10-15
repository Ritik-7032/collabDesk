const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export const IconSpark = (p) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" {...base} {...p}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
  </svg>
);

export const IconPlus = (p) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" {...base} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconLogout = (p) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" {...base} {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
  </svg>
);

export const IconBoard = (p) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" {...base} {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M9 4v16M15 4v16" />
  </svg>
);

export const IconTrash = (p) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" {...base} {...p}>
    <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
  </svg>
);

export const IconPaperclip = (p) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" {...base} {...p}>
    <path d="M21 12.5 12.6 21a4.5 4.5 0 0 1-6.4-6.4l8.9-8.9a3 3 0 1 1 4.2 4.2L10 19.2a1.5 1.5 0 1 1-2.1-2.1L15.5 9.5" />
  </svg>
);

export const IconClose = (p) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" {...base} {...p}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

export const IconCrown = (p) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" {...base} {...p}>
    <path d="m3 8 3.5 3L12 5l5.5 6L21 8l-2 10H5L3 8Z" />
  </svg>
);

export const IconGoogle = (p) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" {...p}>
    <path
      fill="#EA4335"
      d="M12 10.2v3.9h5.5c-.24 1.3-1.7 3.8-5.5 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.15.8 3.88 1.5l2.64-2.55C16.9 3.3 14.7 2.3 12 2.3 6.75 2.3 2.5 6.55 2.5 11.8s4.25 9.5 9.5 9.5c5.48 0 9.12-3.85 9.12-9.27 0-.62-.07-1.1-.15-1.58z"
    />
  </svg>
);

export const IconLoader = (p) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" className="animate-spin" {...base} {...p}>
    <path d="M21 12a9 9 0 1 1-9-9" />
  </svg>
);

export const IconChevronLeft = (p) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" {...base} {...p}>
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

export const IconUser = (p) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" {...base} {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);

export const IconTag = (p) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" {...base} {...p}>
    <path d="M20.6 12.6 12.6 20.6a2 2 0 0 1-2.83 0l-6.37-6.37a2 2 0 0 1 0-2.83l8-8A2 2 0 0 1 13 3h6a2 2 0 0 1 2 2v6a2 2 0 0 1-.4 1.6Z" />
    <circle cx="16.5" cy="7.5" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);

export const IconCalendar = (p) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" {...base} {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M8 3v4M16 3v4M3 10h18" />
  </svg>
);

export const IconCheckSquare = (p) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" {...base} {...p}>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M7.5 12.5l2.7 2.7L16.5 9" />
  </svg>
);

export const IconMessage = (p) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" {...base} {...p}>
    <path d="M21 12a8 8 0 0 1-8 8H5.5a1.5 1.5 0 0 1-1.06-2.56l1.4-1.4A8 8 0 1 1 21 12Z" />
  </svg>
);

export const IconGrip = (p) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" {...base} {...p}>
    <circle cx="9" cy="6" r="1" fill="currentColor" stroke="none" />
    <circle cx="9" cy="12" r="1" fill="currentColor" stroke="none" />
    <circle cx="9" cy="18" r="1" fill="currentColor" stroke="none" />
    <circle cx="15" cy="6" r="1" fill="currentColor" stroke="none" />
    <circle cx="15" cy="12" r="1" fill="currentColor" stroke="none" />
    <circle cx="15" cy="18" r="1" fill="currentColor" stroke="none" />
  </svg>
);

export const IconX = (p) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" {...base} {...p}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

export const IconMore = (p) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" {...base} {...p}>
    <circle cx="12" cy="5" r="1" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    <circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" />
  </svg>
);

export const IconArrowRight = (p) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" {...base} {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const IconUsers = (p) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" {...base} {...p}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M2.5 20c0-3.5 2.9-6 6.5-6s6.5 2.5 6.5 6M16 4.5c1.8.4 3 2 3 3.9 0 1.9-1.2 3.5-3 3.9M20 20c0-2.8-1.9-5-4.5-5.7" />
  </svg>
);

export const IconZap = (p) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" {...base} {...p}>
    <path d="M13 3 4 14h6l-1 7 9-11h-6l1-7Z" />
  </svg>
);

export const IconShield = (p) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" {...base} {...p}>
    <path d="M12 3l7 3v6c0 4.5-3 7.9-7 9-4-1.1-7-4.5-7-9V6l7-3Z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

export const IconSlack = (p) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" {...p}>
    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
  </svg>
);

export const IconMail = (p) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" {...base} {...p}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);
