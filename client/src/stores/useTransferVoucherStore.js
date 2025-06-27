import { create } from "zustand";
import api from "@/services/api";

const useTransferVoucherStore = create((set, get) => ({
    // State
    voucherTemplates: [],
    selectedVoucherName: "",
    selectedVoucher: null,
    memberVouchers: [],
    bypassTemplate: false,
    price: "",
    foc: "",
    oldVouchers: [""],
    selectedMember: null,
    error: "",
    transferFormData: null, // ✅ NEW STATE

    // New fields for created_by, updated_by, remarks
    created_by: "",
    updated_by: "",
    remarks: "",

    // Fetch voucher templates
    fetchVoucherTemplates: async () => {
        try {
            const res = await api.get("/voucher/vm");
            if (res.status === 200) {
                const sorted = res.data.data.sort((a, b) =>
                    a.voucher_template_name.localeCompare(b.voucher_template_name)
                );
                set({ voucherTemplates: sorted, error: "" });
            }
        } catch (err) {
            console.error("Failed to fetch voucher templates:", err);
            set({ error: "Failed to load voucher templates." });
        }
    },

    // Fetch member vouchers
    fetchMemberVoucher: async (name) => {
        if (!name) return;
        try {
            const res = await api.get(`/voucher/m?name=${encodeURIComponent(name)}`);
            set({ memberVouchers: res.status === 200 ? res.data.data : [] });
        } catch (error) {
            console.error("Error fetching member vouchers:", error);
            set({ memberVouchers: [] });
        }
    },

    // Select voucher
    setSelectedVoucherName: async (selectedName) => {
        set({ selectedVoucherName: selectedName });

        try {
            const res = await api.get(`/voucher?name=${encodeURIComponent(selectedName)}`);
            const vouchers = res.data.data;
            if (!vouchers || vouchers.length === 0) {
                set({ selectedVoucher: null, price: "", foc: "" });
                return;
            }
            const voucher = vouchers[0];
            set({ selectedVoucher: voucher });

            if (!get().bypassTemplate) {
                set({
                    price: voucher.default_total_price || "",
                    foc: voucher.default_free_of_charge || "",
                });
            }
        } catch (err) {
            console.error("Error fetching voucher details:", err);
            set({ error: "Failed to fetch voucher details." });
        }
    },

    // Toggle bypass
    toggleBypassTemplate: () => {
        const { bypassTemplate, selectedVoucher } = get();
        const newBypass = !bypassTemplate;
        set({ bypassTemplate: newBypass });

        if (newBypass) {
            set({ price: "", foc: "" });
        } else if (selectedVoucher) {
            set({
                price: selectedVoucher.default_total_price || "",
                foc: selectedVoucher.default_free_of_charge || "",
            });
        }
    },

    // Setters
    setPrice: (price) => set({ price }),
    setFoc: (foc) => set({ foc }),
    setOldVouchers: (vouchers) => set({ oldVouchers: vouchers }),
    setSelectedMember: (member) => set({ selectedMember: member }),
    setTransferFormData: (formData) => set({ transferFormData: formData }), // ✅ NEW SETTER
    // New setters for created_by, updated_by, remarks
    setCreatedBy: (id) => set({ created_by: id }),
    setUpdatedBy: (id) => set({ updated_by: id }),
    setRemarks: (text) => set({ remarks: text }),

    // Derived values
    getTotalOldBalance: () => {
        const { oldVouchers, memberVouchers } = get();
        return oldVouchers.reduce((acc, name) => {
            const match = memberVouchers.find((v) => v.member_voucher_name === name);
            return acc + (match ? Number(match.current_balance) : 0);
        }, 0);
    },

    getTopUpBalance: () => {
        const total = get().getTotalOldBalance();
        const priceNum = Number(get().price) || 0;
        return Math.max(0, priceNum - total);
    },

    // Final transfer submission
    submitTransfer: async (formData) => {

        if (!formData) {
            throw new Error("No form data provided for voucher transfer.");
        }

        const {
            member_name,
            voucher_template_name,
            price,
            foc,
            old_voucher_names,
            old_voucher_details,
            is_bypass,
            created_by,
            updated_by,
            remarks, // <-- added here
        } = formData;

        if (
            !member_name ||
            !voucher_template_name ||
            !price ||
            !old_voucher_names.length ||
            !old_voucher_details?.length
        ) {
            throw new Error("Missing required fields for voucher transfer.");
        }

        const payload = {
            member_name,
            voucher_template_name,
            price: Number(price),
            foc: Number(foc),
            is_bypass: Boolean(is_bypass),
            old_voucher_names,
            old_voucher_details: old_voucher_details.map((v) => ({
                voucher_id: v.voucher_id,
                member_voucher_name: v.member_voucher_name,
                balance_to_transfer: Number(v.balance_to_transfer),
            })),
            created_by: created_by,
            updated_by: updated_by,
            remarks: remarks, // <-- add remarks here
        };


        const res = await api.post("/voucher/transfer", payload);
        return res.data;
    },


}));

export default useTransferVoucherStore;
