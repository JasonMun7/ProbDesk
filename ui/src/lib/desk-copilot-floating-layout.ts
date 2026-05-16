/** CopilotKit chat FAB: `bottom-6 right-6` + `h-14 w-14` */
export const DESK_CHAT_FAB_SIZE_PX = 56;
export const DESK_CHAT_FAB_MARGIN_PX = 24;
export const DESK_INSPECTOR_GAP_PX = 12;

/** Inspector toggle is 48×48 in @copilotkit/web-inspector */
export const DESK_INSPECTOR_BUTTON_SIZE_PX = 48;

/** Legacy: inspector placed to the left of the chat FAB (bottom-right stack). */
export const DESK_INSPECTOR_OFFSET_RIGHT_PX =
  DESK_CHAT_FAB_MARGIN_PX + DESK_CHAT_FAB_SIZE_PX + DESK_INSPECTOR_GAP_PX;

export const DESK_INSPECTOR_OFFSET_BOTTOM_PX =
  DESK_CHAT_FAB_MARGIN_PX +
  Math.round((DESK_CHAT_FAB_SIZE_PX - DESK_INSPECTOR_BUTTON_SIZE_PX) / 2);

export const COPILOT_INSPECTOR_STORAGE_KEY = "cpk:inspector:state";

type Anchor = { horizontal: "left" | "right"; vertical: "top" | "bottom" };
type PersistedButton = {
  anchor?: Anchor;
  anchorOffset?: { x: number; y: number };
  hasCustomPosition?: boolean;
};
type PersistedState = { button?: PersistedButton };

function isLegacyBottomRightInspectorLayout(
  button: PersistedButton,
): boolean {
  if (
    button.anchor?.horizontal !== "right" ||
    button.anchor?.vertical !== "bottom"
  ) {
    return false;
  }
  if (!button.anchorOffset) {
    return true;
  }
  return (
    button.anchorOffset.x === DESK_INSPECTOR_OFFSET_RIGHT_PX &&
    button.anchorOffset.y === DESK_INSPECTOR_OFFSET_BOTTOM_PX
  );
}

export function shouldApplyDeskInspectorLayout(
  button: PersistedButton | undefined,
): boolean {
  if (!button?.anchor) {
    return true;
  }
  const stuckTopRight =
    button.anchor.horizontal === "right" && button.anchor.vertical === "top";
  if (stuckTopRight) {
    return true;
  }
  if (isLegacyBottomRightInspectorLayout(button)) {
    return true;
  }
  return false;
}

/** Place AG-UI inspector FAB at bottom-left (chat toggle stays bottom-right). */
export function applyDeskInspectorFloatingLayout(): void {
  if (typeof window === "undefined") {
    return;
  }

  let state: PersistedState = {};
  try {
    const raw = window.localStorage.getItem(COPILOT_INSPECTOR_STORAGE_KEY);
    if (raw) {
      state = JSON.parse(raw) as PersistedState;
    }
  } catch {
    // ignore corrupt storage
  }

  if (!shouldApplyDeskInspectorLayout(state.button)) {
    return;
  }

  state.button = {
    anchor: { horizontal: "left", vertical: "bottom" },
    anchorOffset: {
      x: DESK_CHAT_FAB_MARGIN_PX,
      y: DESK_CHAT_FAB_MARGIN_PX,
    },
    hasCustomPosition: false,
  };

  try {
    window.localStorage.setItem(
      COPILOT_INSPECTOR_STORAGE_KEY,
      JSON.stringify(state),
    );
  } catch {
    // ignore quota / private mode
  }
}
