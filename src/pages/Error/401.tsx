"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { ArrowLeft, Key, RotateCw } from "lucide-react";

export default function UnauthorizedPage() {
  const router = useNavigate();
  const search = useSearch({ strict: false });
  const errorMessage = (search as any).error || "Invalid or expired reset link";

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-8">
      <Card className="w-full max-w-md border-red-200 dark:border-red-800 overflow-hidden animate-scale">
        <CardHeader className="bgx-gradient-to-r from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-full">
              <Key className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              401 - Unauthorized
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <p className="text-muted-foreground">{errorMessage}</p>
            <div className="flex items-center text-sm bg-red-50 dark:bg-red-900/50 p-3 rounded-md border border-red-200 dark:border-red-800">
              <span className="text-red-600 dark:text-red-400">
                To continue:
              </span>
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                <li>Request a new password reset link</li>
                <li>Ensure you're using the latest link from your email</li>
                <li>Check that the URL is complete and correct</li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col space-y-3">
            <Button
              onClick={() => router({ to: "/forgot-password" })}
              className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 gap-2"
            >
              <Key className="h-4 w-4" />
              Request New Reset Link
            </Button>

            <Button
              variant="outline"
              onClick={() => router({ to: "/" })}
              className="w-full gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Return to Homepage
            </Button>

            <Button
              variant="ghost"
              onClick={() => window.location.reload()}
              className="w-full gap-2 text-muted-foreground"
            >
              <RotateCw className="h-4 w-4" />
              Try Again
            </Button>
          </div>

          <div className="text-xs text-muted-foreground text-center pt-4">
            If you continue to experience issues, please contact support.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
