import { create } from "zustand";
import api from "@/services/api";

const usePositionStore = create((set) => ({
  positions: [],
  loading: false,
  error: null,

  fetchDropdownPositions: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get("/position/dropdown");
      set({ positions: res.data, loading: false });
    } catch (err) {
      set({
        error: err?.response?.data?.message || "Failed to fetch positions",
        loading: false,
      });
    }
  },
}));

export default usePositionStore;