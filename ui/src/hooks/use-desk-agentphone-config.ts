"use client";

import { useCallback, useEffect, useState } from "react";

export type DeskAgentPhoneConfig = {
  apiKeyConfigured: boolean;
  agentId: string | null;
  agentIdSource: "env" | "file" | null;
  agentName: string | null;
};

const EMPTY: DeskAgentPhoneConfig = {
  apiKeyConfigured: false,
  agentId: null,
  agentIdSource: null,
  agentName: null,
};

export function useDeskAgentPhoneConfig() {
  const [config, setConfig] = useState<DeskAgentPhoneConfig>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/desk-settings");
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = (await res.json()) as {
        agentphone?: {
          apiKeyConfigured?: boolean;
          agentId?: string | null;
          agentIdSource?: "env" | "file" | null;
          agentName?: string | null;
        };
      };
      setConfig({
        apiKeyConfigured: data.agentphone?.apiKeyConfigured ?? false,
        agentId: data.agentphone?.agentId ?? null,
        agentIdSource: data.agentphone?.agentIdSource ?? null,
        agentName: data.agentphone?.agentName ?? null,
      });
    } catch {
      setError("Could not load AgentPhone settings.");
      setConfig(EMPTY);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveAgentId = useCallback(
    async (agentId: string, agentName?: string) => {
      const res = await fetch("/api/desk-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentphoneAgentId: agentId,
          ...(agentName !== undefined ? { agentphoneAgentName: agentName } : {}),
        }),
      });
      if (!res.ok) {
        throw new Error(`Save failed (${res.status})`);
      }
      await refresh();
    },
    [refresh],
  );

  return {
    config,
    loading,
    error,
    refresh,
    saveAgentId,
    isAgentIdConfigured: !!config.agentId,
    canSendSms: config.apiKeyConfigured && !!config.agentId,
  };
}
