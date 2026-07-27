import { z } from "zod";

import { organizationIdSchema } from "@/features/organizations/validation/organization";

const displayNameSchema = z
  .string()
  .trim()
  .min(1, "Enter a connection name.")
  .max(100, "Connection name must be 100 characters or fewer.");

const workspaceReferenceSchema = z
  .string()
  .trim()
  .max(100, "Workspace reference must be 100 characters or fewer.")
  .regex(
    /^(?:|[A-Za-z0-9][A-Za-z0-9_-]{0,99})$/,
    "Use letters, numbers, underscores, or hyphens.",
  );

const regionSchema = z.enum(["", "global", "eu", "us", "apac"]);
const companyIdSchema = z
  .string()
  .trim()
  .min(1, "Enter the YCLIENTS company ID.")
  .max(32, "Company ID must be 32 digits or fewer.")
  .regex(/^[0-9]+$/, "Company ID must contain digits only.");

export const crmConnectionIdSchema = z.uuid();

export const createCrmConnectionSchema = z.object({
  displayName: displayNameSchema,
  organizationId: organizationIdSchema,
  region: regionSchema,
  workspaceReference: workspaceReferenceSchema,
});

export const updateCrmConnectionSchema = createCrmConnectionSchema.extend({
  connectionId: crmConnectionIdSchema,
});

export const crmConnectionTargetSchema = z.object({
  connectionId: crmConnectionIdSchema,
  organizationId: organizationIdSchema,
});

export const createYclientsConnectionSchema = z.object({
  companyId: companyIdSchema,
  displayName: displayNameSchema,
  organizationId: organizationIdSchema,
});

export const updateYclientsConnectionSchema =
  createYclientsConnectionSchema.extend({
    connectionId: crmConnectionIdSchema,
  });

export function buildCrmConfiguration(input: {
  region: "" | "apac" | "eu" | "global" | "us";
  workspaceReference: string;
}) {
  return {
    ...(input.workspaceReference
      ? { workspace_reference: input.workspaceReference }
      : {}),
    ...(input.region ? { region: input.region } : {}),
  };
}

export function formValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
