import { z } from "zod";

const organizationNameSchema = z
  .string()
  .trim()
  .min(1, "Enter an organization name.")
  .max(100, "Organization name must be 100 characters or fewer.");

const organizationSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Slug must be at least 3 characters.")
  .max(63, "Slug must be 63 characters or fewer.")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lowercase letters, numbers, and single hyphens.",
  );

export const organizationIdSchema = z.uuid();

export const createOrganizationSchema = z.object({
  name: organizationNameSchema,
  slug: organizationSlugSchema,
});

export const updateOrganizationSchema = createOrganizationSchema.extend({
  organizationId: organizationIdSchema,
});

export const organizationAdminSchema = z.object({
  organizationId: organizationIdSchema,
  userId: z.uuid("Enter a valid user ID."),
});

export function formValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
