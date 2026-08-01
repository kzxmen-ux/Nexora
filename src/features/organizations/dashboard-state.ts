import type { CrmConnection } from "@/features/crm-connections/types";

export type AltegioDashboardStatus =
  | "connected"
  | "error"
  | "incomplete"
  | "not_connected"
  | "paused";

type ResolvedAltegioConnection = {
  connection: CrmConnection | null;
  status: AltegioDashboardStatus;
};

const connectionPriority: Record<CrmConnection["status"], number> = {
  connected: 0,
  error: 1,
  draft: 2,
  disconnected: 3,
};

function mapAltegioStatus(
  status: CrmConnection["status"],
): AltegioDashboardStatus {
  switch (status) {
    case "connected":
      return "connected";
    case "error":
      return "error";
    case "draft":
      return "incomplete";
    case "disconnected":
      return "paused";
  }
}

export function resolveAltegioDashboardConnection(
  connections: CrmConnection[],
): ResolvedAltegioConnection {
  const altegioConnections = connections
    .filter((connection) => connection.provider === "altegio")
    .sort(
      (left, right) =>
        connectionPriority[left.status] - connectionPriority[right.status],
    );
  const connection = altegioConnections[0] ?? null;

  return connection
    ? { connection, status: mapAltegioStatus(connection.status) }
    : { connection: null, status: "not_connected" };
}
