import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { account } from "@/lib/appwrite";

export const Route = createFileRoute("/__authenticated")({
  beforeLoad: async () => {
    try {
      await account.getSession("current");
    } catch (error) {
      throw redirect({
        to: "/login",
        search: { redirect: window.location.pathname },
      });
    }
  },
  loader: async ({ location }) => {
    try {
      const userData = (await account.get()) as any;
      const hasPhone = !!userData.phone;
      const isProfileRoute = location.pathname.includes("profile");

      if (!isProfileRoute && !hasPhone) {
        throw redirect({
          to: "/profile",
          search: { requirePhone: "true" },
        });
      }
    } catch (error) {
      console.error("Error loading authenticated route:", error);
      throw redirect({ to: "/profile", search: { requirePhone: "true" } });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return (
    <div className="authenticated-layout">
      <Outlet />
    </div>
  );
}
