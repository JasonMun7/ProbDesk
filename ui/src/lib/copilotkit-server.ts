import { CopilotRuntime, ExperimentalEmptyAdapter } from "@copilotkit/runtime";
import { createCopilotRuntimeHandler } from "@copilotkit/runtime/v2";
import { HttpAgent } from "@ag-ui/client";

import { probDeskA2UISchema } from "@/lib/a2ui/catalog-schemas";
import { COPILOT_AGENT_ID } from "@/lib/constants";

const COPILOT_BASE_PATH = "/api/copilotkit";

const serviceAdapter = new ExperimentalEmptyAdapter();

const agentUrl =
  process.env.PROB_DESK_AGUI_URL ?? "http://127.0.0.1:8000/";

const mcpAppsUrl = process.env.PROB_DESK_MCP_APPS_URL?.trim();
const mcpAppsServerId =
  process.env.PROB_DESK_MCP_APPS_SERVER_ID?.trim() || "mcp-apps";

export const copilotRuntime = new CopilotRuntime({
  agents: {
    [COPILOT_AGENT_ID]: new HttpAgent({ url: agentUrl }),
  },
  a2ui: {
    agents: [COPILOT_AGENT_ID],
    injectA2UITool: true,
    schema: probDeskA2UISchema,
  },
  ...(mcpAppsUrl
    ? {
        mcpApps: {
          servers: [
            {
              type: "http" as const,
              url: mcpAppsUrl,
              serverId: mcpAppsServerId,
              agentId: COPILOT_AGENT_ID,
            },
          ],
        },
      }
    : {}),
});

copilotRuntime.handleServiceAdapter(serviceAdapter);

const runtimeV2 = copilotRuntime.instance;

const multiRouteHandler = createCopilotRuntimeHandler({
  runtime: runtimeV2,
  basePath: COPILOT_BASE_PATH,
  mode: "multi-route",
});

const singleRouteHandler = createCopilotRuntimeHandler({
  runtime: runtimeV2,
  basePath: COPILOT_BASE_PATH,
  mode: "single-route",
});

/**
 * CopilotKit v2 uses single-route POST envelopes for agent I/O while the
 * inspector / thread store uses REST paths (`GET /threads`, etc.). Next.js
 * must expose subpaths and dispatch non-envelope traffic to multi-route mode.
 */
function shouldUseMultiRoute(pathname: string, method: string): boolean {
  const verb = method.toUpperCase();
  if (verb === "GET" || verb === "PATCH" || verb === "DELETE") {
    return true;
  }
  if (verb !== "POST") {
    return false;
  }

  const normalizedBase =
    COPILOT_BASE_PATH.length > 1 && COPILOT_BASE_PATH.endsWith("/")
      ? COPILOT_BASE_PATH.slice(0, -1)
      : COPILOT_BASE_PATH;

  if (pathname === normalizedBase || pathname === `${normalizedBase}/`) {
    return false;
  }

  return pathname.startsWith(`${normalizedBase}/`);
}

const THREADS_LIST_PATH = `${COPILOT_BASE_PATH}/threads`;

/**
 * Inspector thread list is optional for self-hosted AG-UI (no CopilotKit
 * Intelligence). The runtime returns 422; an empty list keeps the inspector usable.
 */
async function softenOptionalThreadsList(
  request: Request,
  response: Response,
): Promise<Response> {
  const url = new URL(request.url);
  if (
    request.method !== "GET" ||
    url.pathname !== THREADS_LIST_PATH ||
    !url.searchParams.get("agentId") ||
    response.status !== 422
  ) {
    return response;
  }

  return Response.json({ threads: [], nextCursor: null });
}

export async function handleCopilotKitRequest(request: Request): Promise<Response> {
  const { pathname } = new URL(request.url);
  const useMultiRoute = shouldUseMultiRoute(pathname, request.method);
  const response = await (useMultiRoute ? multiRouteHandler : singleRouteHandler)(
    request,
  );
  return useMultiRoute ? softenOptionalThreadsList(request, response) : response;
}
