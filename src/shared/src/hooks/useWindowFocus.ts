import React from "react";
import { useWindowManager } from "../store/windowManager.js";

interface UseWindowFocusOptions {
  id: string;
  active?: boolean;
}

interface UseWindowFocusReturn {
  isActive: boolean;
}

export function useWindowFocus({ id, active = true }: UseWindowFocusOptions): UseWindowFocusReturn {
  const registerWindow = useWindowManager(state => state.registerWindow);
  const unregisterWindow = useWindowManager(state => state.unregisterWindow);
  const isWindowActive = useWindowManager(state => state.isWindowActive);

  React.useEffect(() => {
    if (active) {
      registerWindow(id);
    }
    return () => {
      unregisterWindow(id);
    };
  }, [id, active, registerWindow, unregisterWindow]);

  const isActive = isWindowActive(id);

  return { isActive };
}

export function useHasActiveWindow(): boolean {
  const hasActiveWindow = useWindowManager(state => state.hasActiveWindow);
  return hasActiveWindow();
}