// 6 real Solana DePIN networks shown in the "Coming Soon" rail
// Each entry references an externally-served logo (we don't bundle vendor SVGs)

export interface PartnerEntry {
  name: string;
  status: "live" | "soon" | "exploring";
  blurb: string;
  url: string;
}

export const PARTNERS: PartnerEntry[] = [
  {
    name: "Helium",
    status: "live",
    blurb: "LoRaWAN + 5G coverage rewards. Hotspot rewards readable via DAS.",
    url: "https://helium.com",
  },
  {
    name: "Hivemapper",
    status: "live",
    blurb: "Decentralised street-level mapping driven by dashcam contributors.",
    url: "https://hivemapper.com",
  },
  {
    name: "Render",
    status: "live",
    blurb: "GPU rendering marketplace. RNDR distributions tracked on-chain.",
    url: "https://rendernetwork.com",
  },
  {
    name: "io.net",
    status: "soon",
    blurb: "Distributed GPU compute for AI inference and training workloads.",
    url: "https://io.net",
  },
  {
    name: "Pollen Mobile",
    status: "soon",
    blurb: "Owner-operated cellular network using shareable mobile coverage.",
    url: "https://pollenmobile.io",
  },
  {
    name: "Geodnet",
    status: "exploring",
    blurb: "Centimetre-grade RTK GNSS reference network for precision GPS.",
    url: "https://geodnet.com",
  },
];
