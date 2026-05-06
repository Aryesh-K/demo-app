export function LogoIcon({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="-40 -40 80 80"
      xmlns="http://www.w3.org/2000/svg"
    >
      <polygon
        points="0,-30 26,-15 26,15 0,30 -26,15 -26,-15"
        fill="#0F6E56"
        fillOpacity="0.2"
        stroke="#1D9E75"
        strokeWidth="2"
      />
      <polygon
        points="0,-20 17,-10 17,10 0,20 -17,10 -17,-10"
        fill="none"
        stroke="#1D9E75"
        strokeWidth="1"
        opacity="0.25"
      />
      <line x1="-13" y1="-10" x2="13" y2="-10" stroke="#1D9E75" strokeWidth="1.5" opacity="0.45" />
      <line x1="-17" y1="1" x2="-13" y2="-10" stroke="#1D9E75" strokeWidth="1.5" opacity="0.45" />
      <line x1="17" y1="1" x2="13" y2="-10" stroke="#1D9E75" strokeWidth="1.5" opacity="0.45" />
      <line x1="-17" y1="1" x2="-13" y2="12" stroke="#1D9E75" strokeWidth="1.5" opacity="0.45" />
      <line x1="17" y1="1" x2="13" y2="12" stroke="#1D9E75" strokeWidth="1.5" opacity="0.45" />
      <line x1="-13" y1="12" x2="13" y2="12" stroke="#1D9E75" strokeWidth="1.5" opacity="0.45" />
      <circle cx="-13" cy="-10" r="2.5" fill="#1D9E75" opacity="0.65" />
      <circle cx="13" cy="-10" r="2.5" fill="#1D9E75" opacity="0.65" />
      <circle cx="-17" cy="1" r="2.5" fill="#1D9E75" opacity="0.65" />
      <circle cx="17" cy="1" r="3" fill="#EF9F27" />
      <circle cx="-13" cy="12" r="2.5" fill="#1D9E75" opacity="0.65" />
      <circle cx="13" cy="12" r="2.5" fill="#1D9E75" opacity="0.65" />
      <path
        d="M -9 2 L -2 9 L 12 -7"
        fill="none"
        stroke="#1D9E75"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
