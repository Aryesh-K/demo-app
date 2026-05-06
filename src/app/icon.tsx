import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: "#0a1628",
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="26" height="26" viewBox="-40 -40 80 80">
          <polygon
            points="0,-30 26,-15 26,15 0,30 -26,15 -26,-15"
            fill="#0F6E56"
            stroke="#1D9E75"
            strokeWidth="2"
          />
          <circle cx="-13" cy="-10" r="3" fill="#1D9E75" />
          <circle cx="13" cy="-10" r="3" fill="#1D9E75" />
          <circle cx="-17" cy="1" r="3" fill="#1D9E75" />
          <circle cx="17" cy="1" r="4" fill="#EF9F27" />
          <circle cx="-13" cy="12" r="3" fill="#1D9E75" />
          <circle cx="13" cy="12" r="3" fill="#1D9E75" />
          <path
            d="M -9 2 L -2 9 L 12 -7"
            stroke="#1D9E75"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>
    ),
    { ...size },
  );
}
