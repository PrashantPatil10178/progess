import LeaderboardPage from "@/pages/leaderboard";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/__authenticated/leaderboard")({
  component: LeaderboardPage,
});
