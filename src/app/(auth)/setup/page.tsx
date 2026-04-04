"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { setup } from "@/lib/api/services/auth";
import { ApiError } from "@/lib/api/errors";
import { useToast } from "@/lib/toast/useToast";

const schema = z.object({
  display_name: z
    .string()
    .min(1, "Display name is required")
    .max(100, "Display name must be 100 characters or fewer"),
});

type FormValues = z.infer<typeof schema>;

export default function SetupPage() {
  const router = useRouter();
  const { error: showError, success: showSuccess } = useToast();
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
      await setup(values.display_name.trim());
      showSuccess("GM account created. Welcome!");
      router.push("/gm");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        showError("A GM account has already been set up.");
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
          Game Master Setup
        </h1>
        <p className="mt-2 text-text-secondary text-sm">
          Create the Game Master account. This can only be done once.
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
            htmlFor="display_name"
            className="text-sm font-medium text-text-primary"
          >
            Display name
          </label>
          <input
            id="display_name"
            type="text"
            autoComplete="name"
            placeholder="Enter your name"
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

        <button
          type="submit"
          disabled={isSubmitting}
          className="
            w-full rounded-md bg-brand-blue px-6 py-3 text-sm font-medium text-white
            hover:bg-brand-blue-light disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors min-h-[44px]
          "
        >
          {isSubmitting ? "Creating account..." : "Create GM account"}
        </button>
      </form>
    </div>
  );
}
