"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "@tanstack/react-router";
import { AlertCircle, ArrowLeft, RotateCw } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function OAuthFailurePage() {
  const router = useNavigate();
  const { loginWithGoogle } = useAuth();

  const handleRetry = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error("Retry failed:", error);
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-8">
      <Card className="w-full max-w-md border-red-200 dark:border-red-800 overflow-hidden animate-scale">
        <CardHeader className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-full">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              Login Failed
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <p className="text-muted-foreground">
              We couldn't log you in with your Google account. This might be due
              to:
            </p>
            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
              <li>Network connectivity issues</li>
              <li>Browser restrictions</li>
              <li>Temporary service outage</li>
            </ul>
          </div>

          <div className="flex flex-col space-y-3">
            <Button
              onClick={handleRetry}
              className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 gap-2"
            >
              <RotateCw className="h-4 w-4" />
              Try Again with Google
            </Button>

            <Button
              variant="outline"
              onClick={() => router({ to: "/login" })}
              className="w-full gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Return to Login Page
            </Button>
          </div>

          <div className="text-xs text-muted-foreground text-center pt-4">
            If the problem persists, please contact support.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
