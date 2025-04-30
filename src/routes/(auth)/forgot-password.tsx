import { createFileRoute } from "@tanstack/react-router";
import ForgotPasswordPage from "@/pages/Auth/ForgotPassword";

export const Route = createFileRoute("/(auth)/forgot-password")({
  component: ForgotPasswordPage,
});
