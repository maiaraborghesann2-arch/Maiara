/**
 * Ekklesia Connect mark — a canopy of three overlapping lobes over a trunk.
 * Traced by eye from the storyboard; replace with the official vector when the
 * brand files land.
 */
export function Mark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
      aria-hidden="true"
    >
      <circle cx="14.6" cy="14" r="7.6" />
      <circle cx="25.4" cy="14" r="7.6" />
      <circle cx="20" cy="21.6" r="7.6" />
      <path d="M20 26.4V35" strokeLinecap="round" />
      <path d="M20 30.4l-3.4 2.6M20 30.4l3.4 2.6" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}
