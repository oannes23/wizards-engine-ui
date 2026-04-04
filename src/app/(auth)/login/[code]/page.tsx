"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { login } from "@/lib/api/services/auth";
import { ApiError } from "@/lib/api/errors";

type State = "loading" | "error";

export default function LoginCodePage() {
  const router = useRouter();
  const params = useParams<{ code: string }>();
  const code = params.code;

  const [state, setState] = useState<State>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const hasSubmitted = useRef(false);

  useEffect(() => {
    if (hasSubmitted.current) return;
    hasSubmitted.current = true;

    async function autoLogin() {
      try {
        const result = await login(code);

        // Invite code — empty object signals join flow
        if (!result.id) {
          router.push(`/join?code=${encodeURIComponent(code)}`);
          return;
        }

        // Valid user — redirect by role
        if (result.role === "gm" || result.role === "viewer") {
          router.push("/gm");
        } else {
          router.push("/");
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          setErrorMessage("This link is invalid or has expired.");
        } else {
          setErrorMessage("Something went wrong. Please try again.");
        }
        setState("error");
      }
    }

    autoLogin();
  }, [code, router]);

  if (state === "error") {
    return (
      <div className="flex flex-col items-center gap-8 text-center">
        <Image
          src="/logo.png"
          alt="Wizards Engine"
          width={80}
          height={80}
          className="rounded-lg"
          priority
        />
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-2xl font-bold text-text-primary">
            Sign-in failed
          </h1>
          <p className="text-text-secondary text-sm">{errorMessage}</p>
        </div>
        <Link
          href="/login"
          className="
            rounded-md bg-brand-blue px-6 py-3 text-sm font-medium text-white
            hover:bg-brand-blue-light transition-colors min-h-[44px]
            inline-flex items-center
          "
        >
          Enter code manually
        </Link>
      </div>
    );
  }

  // Loading state
  return (
    <div className="flex flex-col items-center gap-8 text-center">
      <Image
        src="/logo.png"
        alt="Wizards Engine"
        width={80}
        height={80}
        className="rounded-lg"
        priority
      />
      <div className="flex flex-col items-center gap-4">
        <div
          className="h-10 w-10 animate-spin rounded-full border-4 border-brand-teal border-t-transparent"
          aria-hidden="true"
        />
        <p className="text-text-secondary text-sm" role="status" aria-live="polite">
          Signing in...
        </p>
      </div>
    </div>
  );
}
