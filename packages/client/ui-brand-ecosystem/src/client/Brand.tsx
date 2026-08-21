/** Ecosystem brand occupants: a yellow-on-navy diamond mark and wordmark.
 * The mark receives the slot's owner props (`{ size }` from the sidebar's
 * renderSlot call). */

export interface BrandMarkProps {
  size?: number
}

export function EcosystemBrandMark({ size = 24 }: BrandMarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" role="img" aria-label="Ecosystem">
      <rect width="24" height="24" rx="6" fill="#0a1628" />
      <path d="M12 4l6 8-6 8-6-8z" fill="#ffd400" />
    </svg>
  )
}

export function EcosystemBrandName() {
  return <span style={{ color: '#ffffff', fontWeight: 600 }}>Ecosystem</span>
}
