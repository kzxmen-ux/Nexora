export type OrganizationRole = "owner" | "admin";

export type Organization = {
  createdAt: string;
  id: string;
  name: string;
  role: OrganizationRole;
  slug: string;
  updatedAt: string;
};

export type OrganizationActionState = {
  fieldErrors?: {
    name?: string[];
    slug?: string[];
    userId?: string[];
  };
  message?: string;
  status: "idle" | "error" | "success";
};
