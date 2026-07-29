export type CrmProvider = "custom" | "yclients";

export type CrmConnectionStatus =
  | "connected"
  | "disconnected"
  | "draft"
  | "error";

export type CrmConfigurationRegion = "apac" | "eu" | "global" | "us";

export type CrmConnectionConfiguration = {
  region?: CrmConfigurationRegion;
  salonId?: string;
  workspaceReference?: string;
};

export type CrmConnection = {
  configuration: CrmConnectionConfiguration;
  createdAt: string;
  displayName: string;
  id: string;
  lastSyncAt: string | null;
  organizationId: string;
  provider: CrmProvider;
  status: CrmConnectionStatus;
  updatedAt: string;
};

export type CrmConnectionActionState = {
  fieldErrors?: {
    displayName?: string[];
    region?: string[];
    workspaceReference?: string[];
  };
  message?: string;
  status: "error" | "idle" | "success";
};
