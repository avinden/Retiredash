'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html>
      <body className="flex flex-col items-center justify-center min-h-screen gap-4 text-center px-4">
        <h2 className="text-xl font-semibold">Something went wrong</h2>
        <p className="text-muted-foreground max-w-md">
          An unexpected error occurred.
          {error.digest && (
            <span className="block mt-1 text-xs text-muted-foreground/60">
              Digest: {error.digest}
            </span>
          )}
        </p>
        <Button onClick={reset} variant="outline">
          Try again
        </Button>
      </body>
    </html>
  );
}
