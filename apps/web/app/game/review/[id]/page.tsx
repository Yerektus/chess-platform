import { ReviewGame } from "./review-game";

type ReviewGamePageProps = {
  params: {
    id: string;
  };
};

export default function ReviewGamePage({ params }: ReviewGamePageProps) {
  return <ReviewGame id={params.id} />;
}
