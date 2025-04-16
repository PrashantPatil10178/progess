import ProgressPage from "@/pages/progress";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/__authenticated/progress")({
  component: ProgressPage,
});
