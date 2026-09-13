"use client";

import { signOut } from "@/app/(public)/auth/actions";

interface SignOutButtonProps {
  className?: string;
  children?: React.ReactNode;
}

/**
 * Client Component wrapper for the signOut Server Action.
 *
 * Must be a Client Component because it attaches an event (form submit).
 * Uses a <form> with action= so it works without JavaScript (progressive
 * enhancement) and is not vulnerable to CSRF in the same way fetch() would be.
 */
export function SignOutButton({
  className = "",
  children = "Sign out",
}: SignOutButtonProps) {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className={className}
      >
        {children}
      </button>
    </form>
  );
}
