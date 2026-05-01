import type { Metadata } from "next";
import { LearnClient } from "./learn-client";

export const metadata: Metadata = {
  title: "Обучение | Chess Platform",
  description: "Интерактивные шахматные шаблоны по партиям и стилям великих шахматистов."
};

export default function LearnPage() {
  return <LearnClient />;
}
