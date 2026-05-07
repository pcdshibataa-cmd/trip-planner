import LZString from 'lz-string';
import type { TravelItinerary } from '../types/travel';

export function encodeItinerary(itinerary: TravelItinerary): string {
  return LZString.compressToEncodedURIComponent(JSON.stringify(itinerary));
}

export function decodeItinerary(encoded: string): TravelItinerary | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(encoded);
    if (!json) return null;
    return JSON.parse(json) as TravelItinerary;
  } catch {
    return null;
  }
}

export function buildShareUrl(itinerary: TravelItinerary): string {
  const encoded = encodeItinerary(itinerary);
  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}#share=${encoded}`;
}

export function parseShareHash(): TravelItinerary | null {
  const match = window.location.hash.match(/^#share=(.+)$/);
  if (!match) return null;
  return decodeItinerary(match[1]);
}
