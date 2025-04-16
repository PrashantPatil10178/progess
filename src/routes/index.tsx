import { createFileRoute } from "@tanstack/react-router";
import Home from "@/pages/Landing";

export const Route = createFileRoute("/")({
  component: Home,
});
