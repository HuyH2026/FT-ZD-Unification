// Decorative "flora glow" illustration used on the empty Organization dashboard,
// ported from the Figma design's Gradient [Flora] node. It's a soft radial glow
// (teal → peach → cream) with a blurred white core — purely ornamental, so it's
// marked aria-hidden. The embedded product screenshot from the prototype is
// intentionally omitted (no trademarked/photo assets committed here).
export function OrgIllustration({ className }: { className?: string }) {
  return (
    <div aria-hidden className={className}>
      <svg viewBox="0 0 740 740" fill="none" className="block size-full">
        <g opacity="0.5" filter="url(#floraGlow)">
          <circle cx="370" cy="370" r="338" fill="url(#floraRadial)" />
        </g>
        <g opacity="0.72" filter="url(#floraCore)">
          <circle cx="307.227" cy="321.715" r="217.286" fill="#ffffff" />
        </g>
        <defs>
          <filter id="floraGlow" x="0" y="0" width="740" height="740" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation="16" />
          </filter>
          <filter id="floraCore" x="9.94" y="24.43" width="594.571" height="594.571" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation="40" />
          </filter>
          <radialGradient
            id="floraRadial"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(370 370) rotate(-90) scale(303.596)"
          >
            <stop offset="0.134615" stopColor="#38B2C6" />
            <stop offset="0.712208" stopColor="#FBB497" stopOpacity="0.6" />
            <stop offset="0.948014" stopColor="#FFF6F3" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  )
}
