"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getUser, isAuthenticated } from "@/lib/auth";

interface AuthGuardProps {
  children: React.ReactNode;
  /**
   * Optional role gate. If provided, the guard also checks that the
   * stored user's role matches; mismatches redirect back to /login.
   */
  requiredRole?: string;
}

/**
 * AuthGuard — wraps a page that requires authentication.
 *
 * On mount it checks localStorage for a valid session. If the session is
 * missing or the user's role doesn't match `requiredRole`, it immediately
 * replaces the navigation history entry with /login so the user can't
 * press Back to get back into the protected page.
 *
 * While the check is running (one synchronous read of localStorage,
 * but deferred to client-side hydration) it renders a full-screen
 * loading state to avoid a flash of protected content.
 */
export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const router = useRouter();
  // Start as null (unknown) so we render nothing until we've checked.
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      setAllowed(false);
      return;
    }

    if (requiredRole) {
      const user = getUser();
      if (!user || user.role !== requiredRole) {
        // Wrong role — redirect to their correct dashboard or login.
        router.replace("/login");
        setAllowed(false);
        return;
      }
    }

    setAllowed(true);
  }, [router, requiredRole]);

  // While checking (null) or definitively not allowed (false), render nothing.
  // The redirect fires during this time.
  if (!allowed) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="size-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
          <span className="text-[10px] font-mono tracking-widest uppercase text-slate-500">
            Verifying access…
          </span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
