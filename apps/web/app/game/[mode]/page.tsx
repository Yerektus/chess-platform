import { notFound } from "next/navigation";
import { LocalGame } from "./local-game";

type GamePageProps = {
  params: {
    mode: string;
  };
};

export default function GamePage({ params }: GamePageProps) {
  if (params.mode !== "local" && params.mode !== "ai" && params.mode !== "bot" && params.mode !== "online") {
    notFound();
  }

  return <LocalGame mode={params.mode} />;
}
