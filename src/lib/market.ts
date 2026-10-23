export const CHOG_TOKEN = "0x350035555E10d9AfAF1566AaebfCeD5BA6C27777";

export type Weather = "pump" | "sunny" | "rain" | "storm";

export type Market = {
  priceUsd: number;
  change1h: number;
  change24h: number;
  weather: Weather;
  updatedAt: number;
};

// Garden weather follows the real $CHOG chart
export function weatherFor(change1h: number, change24h: number): Weather {
  if (change1h <= -5 || change24h <= -10) return "storm";
  if (change24h >= 10 || change1h >= 5) return "pump";
  if (change24h >= 0) return "sunny";
  return "rain";
}

export const WEATHER_INFO: Record<Weather, { label: string; blurb: string }> = {
  pump: { label: "Golden Hour", blurb: "$CHOG is pumping. Seeds grow 2x." },
  sunny: { label: "Sunny", blurb: "Green candles. Good day to farm." },
  rain: { label: "Drizzle", blurb: "Chart's a bit red. Seeds need water." },
  storm: { label: "Storm", blurb: "Rug weather. Protect your seeds!" },
};
