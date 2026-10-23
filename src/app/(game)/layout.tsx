import { GameShell } from "@/components/verse/GameShell";

export default function GameLayout({ children }: LayoutProps<"/">) {
  return <GameShell>{children}</GameShell>;
}
