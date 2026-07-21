type ZendeskLogoProps = {
  size?: number
  className?: string
  color?: string
}

// Zendesk logomark — the two "sail" shapes: a solid triangle pointing up (its
// apex at top, base at the bottom) beside a rounded fan whose flat edge sits at
// the top. Rendered single-color so it inherits `currentColor` from the chrome.
export function ZendeskLogo({ size = 20, className, color }: ZendeskLogoProps) {
  const fill = color ?? 'currentColor'
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Left sail: solid triangle, apex top-right, base along the bottom */}
      <path d="M11 6.5V22H0L11 6.5Z" fill={fill} />
      {/* Right sail: rounded fan, flat edge at the top, curving down to a point */}
      <path d="M13 22C13 16.7 17.7 12 23 12C23 17.3 18.3 22 13 22Z" fill={fill} />
    </svg>
  )
}
