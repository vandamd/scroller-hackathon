export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" fill="currentColor">
      <rect x="11" y="4" width="16" height="6" rx="2" />
      <rect x="5" y="13" width="16" height="6" rx="2" />
      <rect x="11" y="22" width="16" height="6" rx="2" />
    </svg>
  )
}
