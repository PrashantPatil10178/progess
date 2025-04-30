import { createFileRoute, redirect } from "@tanstack/react-router";
import ResetPasswordPage from "@/pages/Auth/ResetPassword";
import UnauthorizedPage from "@/pages/Error/401";

export const Route = createFileRoute("/(auth)/reset-password")({
  component: ResetPasswordPage,
  errorComponent: UnauthorizedPage,
  validateSearch: (search: Record<string, unknown>) => {
    console.log("Received search params:", search);

    // Check for required parameters
    if (!search.userId || !search.secret || !search.expire) {
      throw redirect({
        to: "/forgot-password",
        search: {
          error: "Invalid password reset link. Please request a new one.",
        },
      });
    }

    try {
      // Handle URL encoded parameters
      const userId = decodeURIComponent(search.userId as string);
      const secret = decodeURIComponent(search.secret as string);
      const expireStr = decodeURIComponent(search.expire as string);

      // Normalize date string (handle both + and space separators)
      const normalizedExpireStr = expireStr.replace(/\+/g, " ");

      // Parse expiration date in UTC
      const expireDate = new Date(normalizedExpireStr + " UTC");

      console.log("Parsed expiration date (UTC):", expireDate.toISOString());

      // Check if date is valid
      if (isNaN(expireDate.getTime())) {
        throw new Error(`Invalid date format: ${normalizedExpireStr}`);
      }

      // Get current time in UTC
      const nowUTC = new Date();
      console.log("Current time (UTC):", nowUTC.toISOString());

      // Check if link is expired (with 5 minute grace period)
      const gracePeriod = 5 * 60 * 1000; // 5 minutes in milliseconds

      if (expireDate.getTime() < nowUTC.getTime() - gracePeriod) {
        throw new Error(`Link expired at ${expireDate.toISOString()}`);
      }

      return {
        userId,
        secret,
        expires: expireDate.toISOString(),
      };
    } catch (error) {
      console.error("Error processing reset link:", error);
      throw redirect({
        to: "/forgot-password",
        search: {
          error: error instanceof Error ? error.message : "Invalid reset link",
        },
      });
    }
  },
});
