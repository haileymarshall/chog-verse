import type { Metadata } from "next";
import { ChogId } from "@/components/verse/ChogId";

export const metadata: Metadata = { title: "Chog ID · Chog Verse", description: "Pick any of the 1,969 Chogs and get its card: tier, rarity, traits and Chog Verse stats." };

export default function ChogIdPage() {
  return <ChogId />;
}
