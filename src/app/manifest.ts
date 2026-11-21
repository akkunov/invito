import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest { return { name: "eventiq", short_name: "eventiq", description: "Сайты-приглашения для особенных событий", start_url: "/ru", display: "standalone", background_color: "#F2F3F5", theme_color: "#EDFF00", icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }] }; }
