import type { Metadata } from "next";
import { Suspense } from "react";
import { ChogId } from "@/components/verse/ChogId";
import { cardImage } from "@/lib/verse/chogid";
import { chogTier, isChogId } from "@/lib/verse/chogs";

export async function generateMetadata({ params }: PageProps<"/id/[id]">): Promise<Metadata> {
  const id = Number((await params).id);
  if (!isChogId(id)) return { title: "Chog ID · Chog Verse" };
  const title = `Chog #${id} · ${chogTier(id)} · Chog ID`;
  const description = "This Chog's card on Chog Verse. Get yours, then join a crew.";
  return {
    title,
    description,
    openGraph: { title, description, images: [{ url: cardImage(id), width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description, images: [cardImage(id)] },
  };
}

async function Card({ params }: { params: PageProps<"/id/[id]">["params"] }) {
  const id = Number((await params).id);
  return <ChogId initialId={isChogId(id) ? id : undefined} />;
}

export default function ChogIdCardPage({ params }: PageProps<"/id/[id]">) {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[#07061a]" />}>
      <Card params={params} />
    </Suspense>
  );
}
