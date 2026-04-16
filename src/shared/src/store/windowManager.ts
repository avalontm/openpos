import { create } from "zustand";

interface WindowManagerState {
  activeWindows: Set<string>;
  registerWindow: (id: string) => void;
  unregisterWindow: (id: string) => void;
  isWindowActive: (id: string) => boolean;
  hasActiveWindow: () => boolean;
}

export const useWindowManager = create<WindowManagerState>((set, get) => ({
  activeWindows: new Set(),

  registerWindow: (id: string) => {
    set(state => {
      const newSet = new Set(state.activeWindows);
      newSet.add(id);
      return { activeWindows: newSet };
    });
  },

  unregisterWindow: (id: string) => {
    set(state => {
      const newSet = new Set(state.activeWindows);
      newSet.delete(id);
      return { activeWindows: newSet };
    });
  },

  isWindowActive: (id: string) => {
    return get().activeWindows.has(id);
  },

  hasActiveWindow: () => {
    return get().activeWindows.size > 0;
  },
}));