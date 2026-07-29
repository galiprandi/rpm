"use client";

import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";

export default function SentryExamplePage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-bold">Sentry Test Page</h1>
        <p className="text-muted-foreground">
          Click the button below to trigger a test error to Sentry.
        </p>
        <Button
          onClick={() => {
            Sentry.captureException(new Error("Sentry test error from RPM"));
          }}
        >
          Trigger Sentry Error
        </Button>
      </div>
    </div>
  );
}
