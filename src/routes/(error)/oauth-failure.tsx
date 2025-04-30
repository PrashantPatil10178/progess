import OAuthFailurePage from "@/pages/Error/OauthFailed";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(error)/oauth-failure")({
  component: OAuthFailurePage,
});
