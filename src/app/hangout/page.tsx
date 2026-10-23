import type { Metadata } from "next";
import { Hangout } from "@/components/verse/Hangout";

export const metadata: Metadata = { title: "Hangout · Chog Verse" };

export default function HangoutPage() {
  return <Hangout />;
}
