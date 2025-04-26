import LoginPage from "@/pages/Auth/login";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(auth)/login")({
  // beforeLoad: async () => {
  //   const seesion = await account.getSession("current");
  //   if (seesion) {
  //     throw redirect({ to: "/dashboard" });
  //   }
  // },
  component: LoginPage,
});
