import {
  Building2,
  MessageSquare,
  Hash,
  Code,
  Mail,
  MessageCircle,
  PhoneIncoming,
  PhoneCall,
  type LucideIcon,
} from 'lucide-react'

// A scattered channel tile from the Figma "Organization" empty state. Each tile
// is a rounded brand-colored square holding a white glyph, tilted and faded so
// the group reads as an orbiting cluster around the central building tile.
// cx/cy are the tile centers within a 404×150 reference box (Figma layout).
type Tile = {
  cx: number
  cy: number
  size: number
  rotate: number
  opacity: number
  color: string
  Icon: LucideIcon
}

const TILES: Tile[] = [
  { cx: 107.85, cy: 44.13, size: 29.4, rotate: 14.55, opacity: 0.5, color: '#e05c34', Icon: MessageSquare }, // Web Widget
  { cx: 173.26, cy: 23.23, size: 16.4, rotate: 13.09, opacity: 0.5, color: '#109081', Icon: MessageCircle }, // WhatsApp
  { cx: 258.9, cy: 25.61, size: 25.5, rotate: -4.76, opacity: 0.5, color: '#7c1d79', Icon: PhoneCall }, // Web Call
  { cx: 390.63, cy: 61.78, size: 15.4, rotate: 14.29, opacity: 0.2, color: '#23831b', Icon: MessageCircle }, // LINE
  { cx: 325.51, cy: 81.95, size: 19.5, rotate: -11.87, opacity: 0.3, color: '#2f69c7', Icon: Mail }, // Email
  { cx: 9.86, cy: 80.25, size: 17.5, rotate: 7.92, opacity: 0.15, color: '#ac2a34', Icon: PhoneIncoming }, // Inbound Voice
  { cx: 260.35, cy: 119.56, size: 31.3, rotate: 8.52, opacity: 0.5, color: '#2f99b3', Icon: Code }, // API
  { cx: 121.78, cy: 103.79, size: 18, rotate: -8.92, opacity: 0.5, color: '#724be8', Icon: Hash }, // Slack
  { cx: 66.95, cy: 127.58, size: 23.3, rotate: -16.82, opacity: 0.25, color: '#3489db', Icon: MessageCircle }, // Messenger
]

// Center of the building tile, shared by the tile and the orbit ring behind it.
const CENTER = { cx: 197.81, cy: 91.46 }
const BUILDING_SIZE = 51.4

const TILE_SHADOW = '0px 0px 1px rgba(0,12,32,0.04), 0px 2px 6px rgba(3,17,38,0.11)'

function ClusterTile({ cx, cy, size, rotate, opacity, color, Icon }: Tile) {
  return (
    <div
      className="absolute flex items-center justify-center"
      style={{
        left: cx,
        top: cy,
        width: size,
        height: size,
        opacity,
        borderRadius: size * 0.38,
        backgroundColor: color,
        transform: `translate(-50%, -50%) rotate(${rotate}deg)`,
        boxShadow: TILE_SHADOW,
      }}
    >
      <Icon size={size * 0.55} className="text-white" strokeWidth={2} />
    </div>
  )
}

// Decorative "flora glow" illustration used on the empty Organization dashboard,
// ported from the Figma design. A soft radial glow (teal → peach → cream) sits
// behind a channel-icon cluster: a central building tile (accent → primary
// gradient) ringed by orbiting, brand-colored channel tiles. Purely ornamental,
// so the whole thing is aria-hidden. The embedded product screenshot from the
// prototype is intentionally omitted (no trademarked/photo assets committed here).
export function OrgIllustration({ className }: { className?: string }) {
  return (
    <div aria-hidden className={`relative ${className ?? ''}`}>
      {/* Soft flora glow, centered behind the cluster. Kept small enough to
          tuck behind the tiles so its blurred edge never reaches the container
          bounds (and so it can't bleed onto the copy below). */}
      <svg
        viewBox="0 0 740 740"
        fill="none"
        className="absolute left-1/2 top-1/2 size-[150px] -translate-x-1/2 -translate-y-1/2 opacity-70"
      >
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

      {/* Channel-icon cluster, positioned within a 404×178 reference box.
          178px is the ring's true extent (center cy≈89, r≈89), so the orbit
          ring fits without clipping — matching the Figma layout. */}
      <div className="absolute left-1/2 top-1/2 h-[178px] w-[404px] -translate-x-1/2 -translate-y-1/2">
        {/* Faint orbit ring behind the central building tile */}
        <svg
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: CENTER.cx, top: CENTER.cy, width: 178, height: 178 }}
          viewBox="0 0 178 178"
          fill="none"
        >
          <circle cx="89" cy="89" r="88" stroke="#d8dcde" strokeOpacity="0.5" strokeWidth="1" />
          <circle cx="89" cy="89" r="60" stroke="#d8dcde" strokeOpacity="0.4" strokeWidth="1" />
        </svg>

        {TILES.map((tile) => (
          <ClusterTile key={tile.color + tile.cx} {...tile} />
        ))}

        {/* Central building tile (accent → primary gradient) */}
        <div
          className="absolute flex items-center justify-center -translate-x-1/2 -translate-y-1/2"
          style={{
            left: CENTER.cx,
            top: CENTER.cy,
            width: BUILDING_SIZE,
            height: BUILDING_SIZE,
            borderRadius: BUILDING_SIZE * 0.38,
            backgroundImage: 'linear-gradient(135deg, #8d59b1 20%, #406cc4 125%)',
            boxShadow: TILE_SHADOW,
          }}
        >
          <Building2 size={BUILDING_SIZE * 0.55} className="text-white" strokeWidth={2} />
        </div>
      </div>
    </div>
  )
}
