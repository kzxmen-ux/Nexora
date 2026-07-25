"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import type { OrganizationActionState } from "../types";
import {
  createOrganizationSchema,
  formValue,
  organizationAdminSchema,
  updateOrganizationSchema,
} from "../validation/organization";

function validationError(
  fieldErrors: OrganizationActionState["fieldErrors"],
): OrganizationActionState {
  return {
    fieldErrors,
    message: "Check the highlighted fields.",
    status: "error",
  };
}

function serviceError(message: string): OrganizationActionState {
  return { message, status: "error" };
}

export async function createOrganizationAction(
  _previousState: OrganizationActionState,
  formData: FormData,
): Promise<OrganizationActionState> {
  const validation = createOrganizationSchema.safeParse({
    name: formValue(formData, "name"),
    slug: formValue(formData, "slug"),
  });

  if (!validation.success) {
    return validationError(validation.error.flatten().fieldErrors);
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    return serviceError("Your session has expired. Sign in and try again.");
  }

  const organizationId = crypto.randomUUID();
  const { error } = await supabase.from("organizations").insert({
    created_by: user.id,
    id: organizationId,
    name: validation.data.name,
    slug: validation.data.slug,
  });

  if (error) {
    if (error?.code === "23505") {
      return validationError({
        slug: ["This organization slug is already in use."],
      });
    }

    return serviceError(
      "The organization could not be created. Try again later.",
    );
  }

  redirect(`/app/organizations/${organizationId}`);
}

export async function updateOrganizationAction(
  _previousState: OrganizationActionState,
  formData: FormData,
): Promise<OrganizationActionState> {
  const validation = updateOrganizationSchema.safeParse({
    name: formValue(formData, "name"),
    organizationId: formValue(formData, "organizationId"),
    slug: formValue(formData, "slug"),
  });

  if (!validation.success) {
    return validationError(validation.error.flatten().fieldErrors);
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    return serviceError("Your session has expired. Sign in and try again.");
  }

  const { data, error } = await supabase
    .from("organizations")
    .update({
      name: validation.data.name,
      slug: validation.data.slug,
    })
    .eq("id", validation.data.organizationId)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error) {
    if (error.code === "23505") {
      return validationError({
        slug: ["This organization slug is already in use."],
      });
    }

    return serviceError(
      "The organization could not be updated. Try again later.",
    );
  }

  if (!data) {
    return serviceError("Organization not found or access was denied.");
  }

  return {
    message: "Organization settings saved.",
    status: "success",
  };
}

export async function addOrganizationAdminAction(
  formData: FormData,
): Promise<OrganizationActionState> {
  const validation = organizationAdminSchema.safeParse({
    organizationId: formValue(formData, "organizationId"),
    userId: formValue(formData, "userId"),
  });

  if (!validation.success) {
    return validationError(validation.error.flatten().fieldErrors);
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    return serviceError("Your session has expired. Sign in and try again.");
  }

  const { error } = await supabase.rpc("add_organization_admin", {
    organization_id: validation.data.organizationId,
    user_id: validation.data.userId,
  });

  if (error) {
    return serviceError(
      "The administrator could not be added. Check owner access and try again.",
    );
  }

  return { message: "Administrator added.", status: "success" };
}

export async function removeOrganizationAdminAction(
  formData: FormData,
): Promise<OrganizationActionState> {
  const validation = organizationAdminSchema.safeParse({
    organizationId: formValue(formData, "organizationId"),
    userId: formValue(formData, "userId"),
  });

  if (!validation.success) {
    return validationError(validation.error.flatten().fieldErrors);
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    return serviceError("Your session has expired. Sign in and try again.");
  }

  const { error } = await supabase.rpc("remove_organization_admin", {
    organization_id: validation.data.organizationId,
    user_id: validation.data.userId,
  });

  if (error) {
    return serviceError(
      "The administrator could not be removed. Check owner access and try again.",
    );
  }

  return { message: "Administrator removed.", status: "success" };
}
