import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { CrmConnection, CrmConnectionStatus } from "@/features/crm-connections/types";

import { resolveAltegioDashboardConnection } from "./dashboard-state.ts";

function connection(
  id: string,
  status: CrmConnectionStatus,
  provider: CrmConnection["provider"] = "altegio",
): CrmConnection {
  return {
    configuration: {},
    createdAt: "2026-08-01T00:00:00.000Z",
    displayName: "Connection",
    id,
    lastSyncAt: null,
    organizationId: "00000000-0000-4000-8000-000000000001",
    provider,
    status,
    updatedAt: "2026-08-01T00:00:00.000Z",
  };
}

describe("organization dashboard Altegio state", () => {
  it("reports not connected without an Altegio record", () => {
    const result = resolveAltegioDashboardConnection([
      connection("development", "connected", "custom"),
    ]);

    assert.equal(result.connection, null);
    assert.equal(result.status, "not_connected");
  });

  it("maps every stored connection state without inventing health", () => {
    assert.equal(
      resolveAltegioDashboardConnection([connection("draft", "draft")])
        .status,
      "incomplete",
    );
    assert.equal(
      resolveAltegioDashboardConnection([
        connection("disconnected", "disconnected"),
      ]).status,
      "paused",
    );
    assert.equal(
      resolveAltegioDashboardConnection([connection("error", "error")])
        .status,
      "error",
    );
    assert.equal(
      resolveAltegioDashboardConnection([
        connection("connected", "connected"),
      ]).status,
      "connected",
    );
  });

  it("prefers a connected record when multiple Altegio records exist", () => {
    const result = resolveAltegioDashboardConnection([
      connection("draft", "draft"),
      connection("connected", "connected"),
      connection("error", "error"),
    ]);

    assert.equal(result.connection?.id, "connected");
    assert.equal(result.status, "connected");
  });
});
