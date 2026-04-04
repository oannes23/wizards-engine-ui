"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { join } from "@/lib/api/services/auth";
import { ApiError } from "@/lib/api/errors";
import { useToast } from "@/lib/toast/useToast";

// The join flow supports player invites (character_name required) and viewer
// invites (character_name omitted). We don't know the invite type client-side
// before the user submits — the backend will tell us via the join response's
// role field. We therefore make character_name optional in the form and show
// both fields, letting the backend ignore character_name for viewer invites.
const schema = z.object({
  display_name: z
    .string()
    .min(1, "Display name is required")
    .max(100, "Display name must be 100 characters or fewer"),
  character_name: z
    .string()
    .max(100, "Character name must be 100 characters or fewer")
    .optional(),
});

type FormValues = z.infer<typeof schema>;

export default function JoinPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { error: showError, success: showSuccess } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const code = searchParams.get("code") ?? "";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  // No code in URL — user navigated here directly
  if (!code) {
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
            No invite code
          </h1>
          <p className="text-text-secondary text-sm">
            You need a magic link to join the game. Ask your Game Master for an
            invite.
          </p>
        </div>
        <Link
          href="/login"
          className="
            rounded-md bg-brand-blue px-6 py-3 text-sm font-medium text-white
            hover:bg-brand-blue-light transition-colors min-h-[44px]
            inline-flex items-center
          "
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      await join({
        code,
        display_name: values.display_name.trim(),
        character_name: values.character_name?.trim() || undefined,
      });
      showSuccess("Welcome to the game!");
      router.push("/");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 404) {
          showError("This invite code is invalid or has already been used.");
        } else if (err.status === 409) {
          showError("This invite has already been redeemed.");
        } else if (err.details?.fields) {
          const firstField = Object.values(err.details.fields)[0];
          showError(firstField ?? "Please check your details and try again.");
        } else {
          showError(err.message ?? "Something went wrong. Please try again.");
        }
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
          Join the Game
        </h1>
        <p className="mt-2 text-text-secondary text-sm">
          Set up your profile to join the game.
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full flex flex-col gap-4"
        noValidate
      >
        {/* Display name */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="display_name"
            className="text-sm font-medium text-text-primary"
          >
            Your name
          </label>
          <input
            id="display_name"
            type="text"
            autoComplete="name"
            placeholder="How you appear to other players"
            {...register("display_name")}
            aria-describedby={errors.display_name ? "display-name-error" : undefined}
            className="
              w-full rounded-md border border-border-default bg-bg-surface
              px-4 py-3 text-text-primary placeholder:text-text-secondary
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue
              transition-colors
            "
          />
          {errors.display_name && (
            <p id="display-name-error" role="alert" className="text-sm text-meter-stress">
              {errors.display_name.message}
            </p>
          )}
        </div>

        {/* Character name */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="character_name"
            className="text-sm font-medium text-text-primary"
          >
            Character name{" "}
            <span className="text-text-secondary font-normal">(if you're a player)</span>
          </label>
          <input
            id="character_name"
            type="text"
            autoComplete="off"
            placeholder="Your character's name"
            {...register("character_name")}
            aria-describedby={errors.character_name ? "character-name-error" : undefined}
            className="
              w-full rounded-md border border-border-default bg-bg-surface
              px-4 py-3 text-text-primary placeholder:text-text-secondary
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue
              transition-colors
            "
          />
          {errors.character_name && (
            <p id="character-name-error" role="alert" className="text-sm text-meter-stress">
              {errors.character_name.message}
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
          {isSubmitting ? "Joining..." : "Join game"}
        </button>
      </form>
    </div>
  );
}
