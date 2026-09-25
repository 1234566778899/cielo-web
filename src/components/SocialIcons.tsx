const icons = {
  Facebook: <path d="M14 8h3V4h-3a4 4 0 0 0-4 4v2H8v4h2v6h4v-6h3l1-4h-4V8.5a.5.5 0 0 1 .5-.5Z" />,
  Instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r=".6" fill="currentColor" />
    </>
  ),
  LinkedIn: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 10v7" />
    </>
  ),
  TikTok: <path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5M14 3c.3 2.6 2 4.3 5 4.5" />,
  X: <path d="M4 4l16 16M20 4 4 20" />,
  YouTube: (
    <>
      <rect x="2.5" y="5" width="19" height="14" rx="4" />
      <path d="m10 9 5 3-5 3V9Z" />
    </>
  ),
};

export function SocialIcons({ className = "", gap = "gap-7" }: { className?: string; gap?: string }) {
  return (
    <ul className={`flex items-center ${gap} ${className}`}>
      {Object.entries(icons).map(([name, paths]) => (
        <li key={name}>
          <a href="#" aria-label={name} className="block transition-opacity hover:opacity-70">
            <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
              {paths}
            </svg>
          </a>
        </li>
      ))}
    </ul>
  );
}
