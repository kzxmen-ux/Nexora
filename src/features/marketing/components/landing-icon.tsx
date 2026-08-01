export type LandingIconName =
  | "calendar"
  | "check"
  | "clock"
  | "medical"
  | "message"
  | "paw"
  | "scissors"
  | "sparkles"
  | "spa";

export function LandingIcon({
  className = "size-5",
  name,
}: {
  className?: string;
  name: LandingIconName;
}) {
  const paths: Record<LandingIconName, React.ReactNode> = {
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path d="M8 3v4M16 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    medical: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="5" />
        <path d="M12 8v8M8 12h8" />
      </>
    ),
    message: (
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" />
    ),
    paw: (
      <>
        <path d="M8.4 12.7c-2.7 1.6-3.7 5.5-1 7 1.6.9 3-.4 4.6-.4s3 1.3 4.6.4c2.7-1.5 1.7-5.4-1-7-2.2-1.3-5-1.3-7.2 0Z" />
        <circle cx="6" cy="8" r="2" />
        <circle cx="11" cy="5" r="2" />
        <circle cx="18" cy="8" r="2" />
      </>
    ),
    scissors: (
      <>
        <circle cx="6" cy="7" r="3" />
        <circle cx="6" cy="17" r="3" />
        <path d="m8.6 8.5 11.4 7M8.6 15.5 20 8" />
      </>
    ),
    sparkles: (
      <>
        <path d="m12 3-1.8 4.2L6 9l4.2 1.8L12 15l1.8-4.2L18 9l-4.2-1.8L12 3Z" />
        <path d="m5 15-.8 2.2L2 18l2.2.8L5 21l.8-2.2L8 18l-2.2-.8L5 15ZM19 14l-1.1 2.9L15 18l2.9 1.1L19 22l1.1-2.9L23 18l-2.9-1.1L19 14Z" />
      </>
    ),
    spa: (
      <>
        <path d="M12 21c-4-2-6-5-6-9 3 0 5 1 6 3 1-2 3-3 6-3 0 4-2 7-6 9Z" />
        <path d="M12 15c-2-2-2.3-5-.5-8 2.7 2 3.2 5 .5 8Z" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      {paths[name]}
    </svg>
  );
}
