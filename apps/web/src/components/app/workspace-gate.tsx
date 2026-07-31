"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  isValidWorkspaceSlug,
  normalizeWorkspaceSlug,
  workspaceAuthPath,
} from "@/lib/workspace-slug";

type WorkspaceGateProps = {
  mode: "login" | "register";
  title: string;
  description: string;
  submitLabel: string;
};

export function WorkspaceGate({
  mode,
  title,
  description,
  submitLabel,
}: WorkspaceGateProps) {
  const router = useRouter();
  const [slug, setSlug] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const normalized = normalizeWorkspaceSlug(slug);
    if (!isValidWorkspaceSlug(normalized)) {
      setError(
        "Use 2–40 characters: lowercase letters, numbers and hyphens (e.g. thelinx).",
      );
      return;
    }
    router.push(workspaceAuthPath(normalized, mode));
  }

  return (
    <div className="mx-auto w-full max-w-md pt-10">
      <div className="card p-6">
        <div className="text-lg font-semibold tracking-tight">{title}</div>
        <div className="mt-1 text-sm leading-6 text-muted">{description}</div>
        <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
          <Field
            label="Workspace slug"
            hint="The short name in your URL — thelinx, acme-properties, etc."
          >
            <Input
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setError(null);
              }}
              placeholder="your-workspace"
              autoComplete="organization"
              required
            />
          </Field>
          {error ? <div className="text-sm text-danger">{error}</div> : null}
          <Button type="submit">{submitLabel}</Button>
        </form>
      </div>
    </div>
  );
}
