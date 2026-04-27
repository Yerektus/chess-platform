import { OnlineGame } from "./online-game";

type OnlineGamePageProps = {
  params: {
    code: string;
  };
};

export default function OnlineGamePage({ params }: OnlineGamePageProps) {
  return <OnlineGame code={params.code.toUpperCase()} />;
}
