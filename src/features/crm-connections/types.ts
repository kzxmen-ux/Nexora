export type CrmProvider = "custom" | "yclients";

export type CrmConnectionStatus =
  | "connected"
  | "disconnected"
  | "draft"
  | "error";

export type CrmConfigurationRegion = "apac" | "eu" | "global" | "us";

export type CrmConnectionConfiguration = {
  companyId?: string;
  region?: CrmConfigurationRegion;
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
    companyId?: string[];
    displayName?: string[];
    partnerToken?: string[];
    region?: string[];
    userToken?: string[];
    workspaceReference?: string[];
  };
  message?: string;
  status: "error" | "idle" | "success";
};
