import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};

export const getFaviconUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch {
    return `https://www.google.com/s2/favicons?domain=${url}&sz=32`;
  }
};

export const fetchWebsiteTitle = async (url: string): Promise<string | null> => {
  try {
    // Try using a CORS proxy to fetch the page HTML
    const corsResponse = await fetch(
      `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
      {
        method: "GET",
      }
    );

    if (corsResponse.ok) {
      const data = await corsResponse.json();
      const html = data.contents;
      if (html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const title = doc.querySelector("title")?.textContent?.trim();
        return title || null;
      }
    }
  } catch (error) {
    console.error("Failed to fetch website title:", error);
  }

  return null;
};

