import { probDeskA2UIDefinitions } from "@/lib/a2ui/schemas";
import type { z } from "zod";

function zodPropsToAgentSchema(schema: z.ZodObject<z.ZodRawShape>) {
  const properties: Record<string, { type: string }> = {};
  for (const [key, value] of Object.entries(schema.shape)) {
    const zodValue = value as z.ZodTypeAny;
    const typeName = (zodValue as { _def?: { typeName?: string } })._def?.typeName ?? "";
    const type =
      typeName === "ZodString"
        ? "string"
        : typeName === "ZodNumber"
          ? "number"
          : typeName === "ZodBoolean"
            ? "boolean"
            : typeName === "ZodEnum"
              ? "string"
              : "unknown";
    properties[key] = { type };
  }
  return properties;
}

/** Server-safe A2UI schema for CopilotRuntime (no React / a2ui-renderer). */
export const probDeskA2UISchema = Object.entries(probDeskA2UIDefinitions).map(
  ([name, def]) => ({
    name,
    description: def.description,
    props: zodPropsToAgentSchema(def.props),
  }),
);
