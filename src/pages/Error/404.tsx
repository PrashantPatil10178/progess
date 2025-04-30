"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Home, RotateCw } from "lucide-react";

export default function NotFoundPage() {
  const router = useNavigate();

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-8">
      <Card className="w-full max-w-md border-orange-200 dark:border-orange-800 overflow-hidden animate-scale">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-full">
              <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              404 - Page Not Found
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <p className="text-muted-foreground">
              The page you're looking for doesn't exist or may have been moved.
            </p>
            <div className="flex items-center text-sm bg-orange-50 dark:bg-orange-900/50 p-3 rounded-md border border-orange-200 dark:border-orange-800">
              <span className="text-orange-600 dark:text-orange-400">
                Possible reasons:
              </span>
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                <li>Incorrect URL</li>
                <li>Outdated bookmark</li>
                <li>Page has been removed</li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col space-y-3">
            <Button
              onClick={() => router({ to: "/" })}
              className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 gap-2"
            >
              <Home className="h-4 w-4" />
              Return to Homepage
            </Button>

            <Button
              variant="outline"
              onClick={() => router({ to: window.location.href })}
              className="w-full gap-2"
            >
              <RotateCw className="h-4 w-4" />
              Refresh Page
            </Button>
          </div>

          <div className="text-xs text-muted-foreground text-center pt-4">
            If you believe this is an error, contact support.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
