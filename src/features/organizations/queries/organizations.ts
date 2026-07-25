import "server-only";

import { createClient } from "@/lib/supabase/server";

import type { Organization, OrganizationRole } from "../types";

type OrganizationRow = {
  created_at: string;
  id: string;
  name: string;
  slug: string;
  updated_at: string;
};

type MembershipRow = {
  organization_id: string;
  role: OrganizationRole;
};

export async function listOrganizationsForCurrentUser(): Promise<
  Organization[]
> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    return [];
  }

  const { data: memberships, error: membershipError } = await supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .returns<MembershipRow[]>();

  if (membershipError || !memberships?.length) {
    return [];
  }

  const roleByOrganizationId = new Map(
    memberships.map((membership) => [
      membership.organization_id,
      membership.role,
    ]),
  );

  const { data: organizations, error: organizationError } = await supabase
    .from("organizations")
    .select("id, name, slug, created_at, updated_at")
    .in("id", [...roleByOrganizationId.keys()])
    .order("name")
    .returns<OrganizationRow[]>();

  if (organizationError || !organizations) {
    return [];
  }

  return organizations.flatMap((organization) => {
    const role = roleByOrganizationId.get(organization.id);

    if (!role) {
      return [];
    }

    return [
      {
        createdAt: organization.created_at,
        id: organization.id,
        name: organization.name,
        role,
        slug: organization.slug,
        updatedAt: organization.updated_at,
      },
    ];
  });
}

export async function getOrganizationForCurrentUser(
  organizationId: string,
): Promise<Organization | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    return null;
  }

  const { data: organization, error: organizationError } = await supabase
    .from("organizations")
    .select("id, name, slug, created_at, updated_at")
    .eq("id", organizationId)
    .maybeSingle<OrganizationRow>();

  if (!organization || organizationError) {
    return null;
  }

  const { data: membership, error: membershipError } = await supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("organization_id", organization.id)
    .eq("user_id", user.id)
    .maybeSingle<MembershipRow>();

  if (!membership || membershipError) {
    return null;
  }

  return {
    createdAt: organization.created_at,
    id: organization.id,
    name: organization.name,
    role: membership.role,
    slug: organization.slug,
    updatedAt: organization.updated_at,
  };
}
