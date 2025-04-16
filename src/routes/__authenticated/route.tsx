import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { account } from "@/lib/appwrite"; // Import your Appwrite auth directly

export const Route = createFileRoute("/__authenticated")({
  beforeLoad: async () => {
    try {
      await account.getSession("current");
    } catch (error) {
      throw redirect({ to: "/login" });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      <Outlet />
    </div>
  );
}
