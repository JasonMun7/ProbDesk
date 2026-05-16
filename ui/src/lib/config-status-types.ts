/** Response shape from `GET /api/config-status`. */
export type ConfigStatus = {
  kalshi: {
    apiKeyId: boolean;
    privateKey: boolean;
    configured: boolean;
  };
  agent: {
    googleApiKey: boolean;
    aguiUrl: string;
  };
  agentphone: {
    apiKeyConfigured: boolean;
    configured: boolean;
    agentId: string | null;
    agentIdConfigured: boolean;
    agentIdSource: "env" | "file" | null;
    smsReady: boolean;
    agentName?: string | null;
  };
  copilot: {
    runtimeUrl: string;
    agentId: string;
    mcpApps: boolean;
  };
  version: string;
};
