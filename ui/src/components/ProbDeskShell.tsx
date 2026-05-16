"use client";

import { DeskAgentPhoneFlow } from "@/components/DeskAgentPhoneFlow";
import { DeskCopilotSidebar } from "@/components/DeskCopilotSidebar";
import { DeskFollowUpSuggestions } from "@/components/DeskFollowUpSuggestions";
import { DeskGetStartedModal } from "@/components/DeskGetStartedModal";
import { DeskStarterSuggestions } from "@/components/DeskStarterSuggestions";
import { DeskView } from "@/components/DeskView";
import { ProbDeskLayout } from "@/components/ProbDeskLayout";
import { SettingsPanel } from "@/components/SettingsPanel";
import type { ConfigStatus } from "@/lib/config-status-types";
import {
  dismissOnboarding,
  isOnboardingDismissed,
  ONBOARDING_SHOW_EVENT,
} from "@/lib/onboarding-storage";
import {
  isProbDeskViewId,
  type ProbDeskViewId,
} from "@/lib/prob-desk-nav";
import { useCallback, useEffect, useState } from "react";

export default function ProbDeskShell() {
  const [activeView, setActiveView] = useState<ProbDeskViewId>("desk");
  const [configStatus, setConfigStatus] = useState<ConfigStatus | null>(null);
  const [configLoadError, setConfigLoadError] = useState<string | null>(null);
  const [configReady, setConfigReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/config-status");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as ConfigStatus;
        if (!cancelled) {
          setConfigStatus(data);
          setConfigLoadError(null);
        }
      } catch {
        if (!cancelled) {
          setConfigLoadError("Could not load configuration status.");
        }
      } finally {
        if (!cancelled) setConfigReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!configReady) return;
    if (!isOnboardingDismissed()) {
      setShowOnboarding(true);
    }
  }, [configReady]);

  useEffect(() => {
    const onShow = () => setShowOnboarding(true);
    window.addEventListener(ONBOARDING_SHOW_EVENT, onShow);
    return () => window.removeEventListener(ONBOARDING_SHOW_EVENT, onShow);
  }, []);

  const handleNavSelect = useCallback((id: string) => {
    if (isProbDeskViewId(id)) {
      setActiveView(id);
    }
  }, []);

  const openSettings = useCallback(() => {
    setActiveView("settings");
  }, []);

  const dismissGetStarted = useCallback(() => {
    dismissOnboarding();
    setShowOnboarding(false);
  }, []);

  return (
    <ProbDeskLayout active={activeView} onNavSelect={handleNavSelect}>
      <DeskAgentPhoneFlow onOpenSettings={openSettings}>
        <div className="flex flex-1 flex-col">
          {activeView === "desk" && <DeskView />}
          {activeView === "settings" && <SettingsPanel />}

          <DeskStarterSuggestions />
          <DeskFollowUpSuggestions />
          <DeskCopilotSidebar />
        </div>

        {configReady ? (
          <DeskGetStartedModal
            open={showOnboarding}
            status={configStatus}
            loadError={configLoadError}
            onDismiss={dismissGetStarted}
            onOpenSettings={openSettings}
          />
        ) : null}
      </DeskAgentPhoneFlow>
    </ProbDeskLayout>
  );
}
