/** CopilotKit suggestion marker — intercepted before sending to the agent. */
export const DESK_AGENTPHONE_SMS_MARKER = "__probdesk_agentphone_sms__";

export const DESK_AGENTPHONE_SMS_SUGGESTION = {
  title: "Send SMS alert",
  message: DESK_AGENTPHONE_SMS_MARKER,
} as const;

export function isAgentPhoneSmsSuggestion(message: string | undefined): boolean {
  return message === DESK_AGENTPHONE_SMS_MARKER;
}

export function buildAgentPhoneSmsPrompt(
  phone: string,
  body: string,
  agentId: string,
  agentName?: string | null,
): string {
  const nameLine = agentName?.trim()
    ? `AgentPhone agent name: ${agentName.trim()}.`
    : "";

  return [
    "I explicitly request an SMS via AgentPhone MCP.",
    `Use AgentPhone agent ID: ${agentId}.`,
    nameLine,
    `Send a text message to ${phone.trim()}.`,
    `Message body: ${body.trim()}`,
    "Confirm in chat before sending if your policy requires it, then use AgentPhone tools with this agent ID.",
  ]
    .filter(Boolean)
    .join(" ");
}
