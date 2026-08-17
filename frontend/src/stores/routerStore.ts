import { create } from 'zustand';

interface RouterState {
  routingResults: any;
  setRoutingResults: (results: any) => void;
  isRouting: boolean;
  setIsRouting: (isRouting: boolean) => void;
}

export const useRouterStore = create<RouterState>((set) => ({
  routingResults: null,
  setRoutingResults: (results) => set({ routingResults: results }),
  isRouting: false,
  setIsRouting: (isRouting) => set({ isRouting })
}));