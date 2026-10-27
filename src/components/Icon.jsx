const iconPaths = {
  bolt: <path d="m13 2-3 8h7l-6 12 1-9H6l7-11Z" />,
  home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9M9 20v-6h6v6" /></>,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>,
  heart: <path d="M20.8 8.7c0 4.5-8.8 10-8.8 10s-8.8-5.5-8.8-10A4.7 4.7 0 0 1 12 6.3a4.7 4.7 0 0 1 8.8 2.4Z" />,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
  library: <><rect x="4" y="4" width="7" height="16" rx="1" /><rect x="13" y="4" width="7" height="16" rx="1" /><path d="M7 8h1M16 8h1" /></>,
  play: <><path d="m8 5 12 7-12 7V5Z" /></>,
  message: <><path d="M4 5h16v12H9l-5 4V5Z" /><path d="M8 10h8M8 13h5" /></>,
  chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
  star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />,
  history: <><path d="M3 12a9 9 0 1 0 2.6-6.4L3 8" /><path d="M3 3v5h5M12 7v5l3 2" /></>,
  search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
  flame: <><path d="M12 22c5 0 8-3.5 8-8 0-3.5-2.1-6.2-5-9-.1 2.4-1.2 3.8-2.4 4.7C12.2 6.2 10.1 3.8 8 2 8.5 6 5 9.2 5 14c0 4.5 2.8 8 7 8Z" /><path d="M12 22c-2.1 0-3.5-1.5-3.5-3.7 0-1.6.9-3 2.3-4.5.2 1.5 1.2 2.1 1.8 2.3.2-.9.7-1.6 1.5-2.2.8 1.2 1.4 2.5 1.4 4.2 0 2.4-1.4 3.9-3.5 3.9Z" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
  arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
};

function Icon({ name, className = '' }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill={name === 'bolt' || name === 'play' ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      {iconPaths[name]}
    </svg>
  );
}

export default Icon;
