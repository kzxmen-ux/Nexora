import { ImageResponse } from "next/og";

export const alt = "Orqelio AI manager";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background:
          "linear-gradient(135deg, #f8fafc 0%, #eef2ff 52%, #ede9fe 100%)",
        color: "#0f172a",
        display: "flex",
        height: "100%",
        justifyContent: "center",
        padding: "72px 88px",
        width: "100%",
      }}
    >
      <div
        style={{
          alignItems: "flex-start",
          display: "flex",
          flexDirection: "column",
          maxWidth: 1024,
          width: "100%",
        }}
      >
        <div style={{ alignItems: "center", display: "flex", gap: 24 }}>
          <div
            style={{
              alignItems: "center",
              background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
              borderRadius: 28,
              color: "white",
              display: "flex",
              fontSize: 72,
              fontWeight: 700,
              height: 128,
              justifyContent: "center",
              width: 128,
            }}
          >
            O
          </div>
          <div style={{ display: "flex", fontSize: 76, fontWeight: 700 }}>
            Orqelio
          </div>
        </div>
        <div
          style={{
            color: "#3730a3",
            display: "flex",
            fontSize: 44,
            fontWeight: 600,
            marginTop: 52,
          }}
        >
          AI manager for service businesses
        </div>
        <div
          style={{
            color: "#475569",
            display: "flex",
            fontSize: 30,
            lineHeight: 1.45,
            marginTop: 22,
            maxWidth: 900,
          }}
        >
          Connect customer conversations with the CRM your business already
          trusts.
        </div>
      </div>
    </div>,
    size,
  );
}
