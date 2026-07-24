import spacexLogo from '@/assets/org-logos/spacex.png'
import teslaLogo from '@/assets/org-logos/tesla.webp'

// Per-org header logo, keyed by Org.id (see org-context.tsx INITIAL_ORGS).
// Orgs without an entry fall back to the generic Building2 icon in OrgSwitcher.
// Bundled locally rather than hotlinked — the SpaceX source blocks external
// referers (403s), so a remote <img src> silently renders blank.
export const ORG_LOGOS: Record<string, string> = {
  spacex: spacexLogo,
  tesla: teslaLogo,
}
