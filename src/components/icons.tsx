function Icon({ path, size = 16 }: { path: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}

export const IconCamera = (p: { size?: number }) => (
  <Icon size={p.size} path="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
);

export const IconWarning = (p: { size?: number }) => (
  <Icon size={p.size} path="M12 3 2 21h20L12 3Z M12 10v5 M12 18h.01" />
);

export const IconChevronDown = (p: { size?: number }) => (
  <Icon size={p.size} path="M6 9l6 6 6-6" />
);
