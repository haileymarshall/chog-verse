import { fetchChogMarket } from "@/lib/market.server";

export async function GET() {
  const market = await fetchChogMarket();
  if (!market) return Response.json({ error: "market unavailable" }, { status: 503 });
  return Response.json(market);
}
