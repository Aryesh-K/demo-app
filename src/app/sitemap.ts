import { type MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://toxiclearai.com", lastModified: new Date() },
    { url: "https://toxiclearai.com/check/free", lastModified: new Date() },
    { url: "https://toxiclearai.com/learn/free", lastModified: new Date() },
    { url: "https://toxiclearai.com/signup", lastModified: new Date() },
    { url: "https://toxiclearai.com/privacy", lastModified: new Date() },
    { url: "https://toxiclearai.com/terms", lastModified: new Date() },
  ];
}
