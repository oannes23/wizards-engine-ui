"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { login } from "@/lib/api/services/auth";
import { ApiError } from "@/lib/api/errors";
import { useToast } from "@/lib/toast/useToast";

const schema = z.object({
  code: z.string().min(1, "Please enter your magic link code"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { error: showError } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      const result = await login(values.code.trim());

      // Invite code — empty object response signals join flow
      if (!result.id) {
        router.push(`/join?code=${encodeURIComponent(values.code.trim())}`);
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
        showError("That code wasn't found. Check the link and try again.");
      } else {
        showError("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Logo */}
      <Image
        src="/logo.png"
        alt="Wizards Engine"
        width={80}
        height={80}
        className="rounded-lg"
        priority
      />

      {/* Heading */}
      <div className="text-center">
        <h1 className="font-heading text-3xl font-bold text-brand-teal">
          Sign In
        </h1>
        <p className="mt-2 text-text-secondary text-sm">
          Enter your magic link code to sign in.
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full flex flex-col gap-4"
        noValidate
      >
        <div className="flex flex-col gap-1">
          <label
            htmlFor="code"
            className="text-sm font-medium text-text-primary"
          >
            Magic link code
          </label>
          <input
            id="code"
            type="text"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder="Paste your code here"
            {...register("code")}
            aria-describedby={errors.code ? "code-error" : undefined}
            className="
              w-full rounded-md border border-border-default bg-bg-surface
              px-4 py-3 text-text-primary placeholder:text-text-secondary
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue
              transition-colors
            "
          />
          {errors.code && (
            <p id="code-error" role="alert" className="text-sm text-meter-stress">
              {errors.code.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="
            w-full rounded-md bg-brand-blue px-6 py-3 text-sm font-medium text-white
            hover:bg-brand-blue-light disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors min-h-[44px]
          "
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
