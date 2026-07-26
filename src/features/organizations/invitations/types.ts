export type InvitationStatus =
  | "accepted"
  | "expired"
  | "pending"
  | "revoked";

export type OrganizationAdministrator = {
  createdAt: string;
  email: string;
  userId: string;
};

export type OrganizationInvitation = {
  createdAt: string;
  email: string;
  expiresAt: string;
  id: string;
  status: InvitationStatus;
};

export type AdministratorManagementData = {
  administrators: OrganizationAdministrator[];
  invitations: OrganizationInvitation[];
  loadError: boolean;
};

export type InvitationActionState = {
  fieldErrors?: {
    email?: string[];
    token?: string[];
  };
  invitationLink?: string;
  message?: string;
  status: "idle" | "error" | "success";
};
