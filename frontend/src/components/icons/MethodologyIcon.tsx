export function MethodologyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M12 2.5a6.5 6.5 0 00-4.99 10.72c.43.45.7 1.06.74 1.7V15c0 .97.79 1.75 1.75 1.75h5c.97 0 1.75-.78 1.75-1.75v-.08c.05-.63.32-1.24.74-1.7A6.5 6.5 0 0012 2.5z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.5 20h5M10.75 22h2.5" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.5 6.5l.9.8M12 4.5V3M14.5 6.5l-.9.8" />
    </svg>
  );
}
