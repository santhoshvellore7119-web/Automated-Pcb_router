import { create } from 'zustand';

export const useRouterStore = create((set) => ({
  routingResults: null,
  isRouting: false,
  setRoutingResults: (results) => set({ routingResults: results }),
  setIsRouting: (isRouting) => set({ isRouting })
}));