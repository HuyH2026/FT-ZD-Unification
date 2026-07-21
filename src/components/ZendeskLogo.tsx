type ZendeskLogoProps = {
  size?: number
  className?: string
  color?: string
}

// Zendesk logomark, traced from the design file (Figma node 491:22591).
// Rendered single-color so it inherits `currentColor` from the chrome.
export function ZendeskLogo({ size = 20, className, color }: ZendeskLogoProps) {
  const fill = color ?? 'currentColor'
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11.3309 8.28418V19.438H2.1001L11.3309 8.28418ZM11.3309 4.28418C11.3309 6.82264 9.25394 8.89956 6.71548 8.89956C4.17702 8.89956 2.1001 6.82264 2.1001 4.28418H11.3309ZM12.8693 19.438C12.8693 16.8996 14.9463 14.8226 17.4847 14.8226C20.0232 14.8226 22.1001 16.8996 22.1001 19.438H12.8693ZM12.8693 15.438V4.28418H22.1001L12.8693 15.438Z"
        fill={fill}
      />
    </svg>
  )
}
