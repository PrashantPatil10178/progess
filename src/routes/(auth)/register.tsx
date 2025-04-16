import RegisterPage from "@/pages/Auth/register";
import { createFileRoute } from "@tanstack/react-router";
import { account } from "@/lib/appwrite";
import { redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/(auth)/register")({
  beforeLoad: async () => {
    const seesion = await account.getSession("current");
    if (seesion) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: RegisterPage,
});
