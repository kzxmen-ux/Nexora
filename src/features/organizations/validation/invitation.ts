import { z } from "zod";

import { organizationIdSchema } from "./organization";

export const invitationTokenSchema = z
  .string()
  .regex(/^[A-Za-z0-9_-]{43}$/, "Invitation link is invalid.");

export const createInvitationSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254, "Email address is too long.")
    .email("Enter a valid email address."),
  organizationId: organizationIdSchema,
});

export const revokeInvitationSchema = z.object({
  invitationId: z.uuid(),
  organizationId: organizationIdSchema,
});

export const removeAdministratorSchema = z.object({
  organizationId: organizationIdSchema,
  userId: z.uuid(),
});
