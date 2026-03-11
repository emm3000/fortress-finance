import { create } from "zustand";
import * as Network from "expo-network";

interface NetworkState {
  isOnline: boolean;
  isInitialized: boolean;
  initialize: () => Promise<() => void>;
}

const resolveOnlineStatus = (state: Network.NetworkState) =>
  Boolean(state.isConnected) && Boolean(state.isInternetReachable ?? state.isConnected);

export const useNetworkStore = create<NetworkState>((set, get) => ({
  isOnline: true,
  isInitialized: false,
  initialize: async () => {
    if (get().isInitialized) {
      return () => {};
    }

    const initialState = await Network.getNetworkStateAsync();
    set({
      isOnline: resolveOnlineStatus(initialState),
      isInitialized: true,
    });

    const subscription = Network.addNetworkStateListener((state) => {
      set({ isOnline: resolveOnlineStatus(state) });
    });

    return () => {
      subscription.remove();
    };
  },
}));
