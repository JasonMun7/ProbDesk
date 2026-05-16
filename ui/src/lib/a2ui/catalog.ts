"use client";

import { createCatalog } from "@copilotkit/a2ui-renderer";
import {
  A2UIKalshiMarketCard,
  A2UIMetric,
  A2UIStatusBadge,
} from "@/lib/a2ui/components";
import { probDeskA2UIDefinitions } from "@/lib/a2ui/schemas";

export const probDeskA2UICatalog = createCatalog(
  probDeskA2UIDefinitions,
  {
    Metric: A2UIMetric,
    StatusBadge: A2UIStatusBadge,
    KalshiMarketCard: A2UIKalshiMarketCard,
  },
  {
    catalogId: "probdesk://a2ui",
    includeBasicCatalog: true,
  },
);
