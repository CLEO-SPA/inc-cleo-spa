import { create } from 'zustand';
import api from '@/services/api';

const useRefundStore = create((set) => ({
  serviceTransactions: [],
  serviceItem: null,
  total: 0,
  isLoading: false,
  error: null,
  memberVouchers: [],
  memberInfo: null,
  selectedVoucher: null,
  creditNotes: [],
  selectedCreditNote: null,
  creditNotesTotal: 0,

  fetchServiceTransactions: async ({ memberId, receiptNo, limit = 5, offset = 0 }) => {
    //console.log('Fetching service transactions with:', { memberId, receiptNo });
    set({ isLoading: true, error: null });
    try {
      const params = {};
      if (memberId !== undefined) params.member_id = memberId;
      if (receiptNo) params.receipt_no = receiptNo;
      params.limit = limit;
      params.offset = offset;

      const response = await api.get('/refund/service-transactions', { params });

      set({
        serviceTransactions: response.data.transactions,
        total: response.data.total,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error.response?.data?.message || error.message || 'Failed to fetch service transactions',
        isLoading: false,
      });
    }
  },

  fetchServiceItemById: async (itemId) => {
    set({ isLoading: true, error: null });

    try {
      const res = await api.get(`/refund/service-item/${itemId}`);
      set({ serviceItem: res.data, isLoading: false });
    } catch (err) {
      set({
        error: err.response?.data?.message || 'Failed to load service item',
        isLoading: false,
      });
    }
  },

  submitRefundService: async ({
    saleTransactionId,
    saleTransactionItemId,
    remarks,
    quantity,
    refundDate,
    employeeId,
    servicename,
    originalUnitPrice,
    customUnitPrice,
    discountPercentage,
    amount,
    handledById,
    creditNoteNo,
  }) => {
    if (!employeeId) throw new Error("Employee ID is missing.");

    const payload = {
      saleTransactionId,
      refundRemarks: remarks,
      refundedBy: employeeId,
      handledBy: handledById,
      refundDate,
      creditNoteNo,
      refundItems: [
        {
          sale_transaction_item_id: Number(saleTransactionItemId),
          service_name: servicename,
          original_unit_price: parseFloat(originalUnitPrice ?? "0"),
          custom_unit_price: customUnitPrice ? parseFloat(customUnitPrice) : null,
          discount_percentage: discountPercentage ? parseFloat(discountPercentage) : null,
          quantity,
          amount,
          remarks,
        },
      ],
    };

    const res = await api.post("/refund/service", payload);
    return res.data; // { refundTransactionId }
  },

  fetchMemberVouchersByMemberId: async (memberId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get(`/refund/member-voucher/member/${memberId}`);

      set({
        memberVouchers: res.data.vouchers,
        memberInfo: res.data.member,
        isLoading: false,
      });
    } catch (err) {
      set({
        error: err.response?.data?.message || "Failed to fetch member vouchers",
        isLoading: false,
      });
    }
  },

  submitRefundMemberVoucher: async ({ memberVoucherId, refundedBy, createdBy, refundDate, remarks, creditNoteNumber }) => {
    try {
      const res = await api.post("/refund/member-voucher", {
        memberVoucherId,
        refundedBy,   // staff who handled refund
        createdBy,    // user who created the refund (logged-in user)
        refundDate,
        remarks,
        creditNoteNumber,
      });
      return res.data; // { refundTransactionId: number }
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || "Refund failed");
    }
  },

  fetchMemberVoucherById: async (voucherId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get(`/refund/member-voucher/${voucherId}`);
      set({
        selectedVoucher: res.data,
        isLoading: false,
      });
    } catch (err) {
      set({
        error: err.response?.data?.message || "Failed to fetch voucher",
        isLoading: false,
      });
    }
  },

  // Fetch paginated credit notes with optional filters
  fetchCreditNotes: async ({ member, startDate, endDate, page = 1, pageSize = 10, type }) => {
    set({ isLoading: true, error: null });
    try {
      const params = {
        page,
        limit: pageSize,
      };
      if (member) params.memberName = member;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (type) params.refundType = type;

      const res = await api.get('/refund/records', { params });
      set({
        creditNotes: res.data.data,
        creditNotesTotal: res.data.pagination.total,
        isLoading: false,
      });
    } catch (err) {
      set({
        error: err.response?.data?.message || 'Failed to fetch credit notes',
        isLoading: false,
      });
    }
  },

  // Fetch detail by ID
  fetchCreditNoteById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get(`/refund/records/${id}`);
      set({
        selectedCreditNote: res.data,
        isLoading: false,
      });
    } catch (err) {
      set({
        error: err.response?.data?.message || 'Failed to fetch credit note detail',
        isLoading: false,
      });
    }
  },

  clear: () => set({
    serviceTransactions: [],
    serviceItem: null,
    memberVouchers: [],
    memberInfo: null,
    error: null,
    isLoading: false,
    selectedVoucher: null,
  }),

  clearCreditNotes: () => set({
    creditNotes: [],
    selectedCreditNote: null,
    creditNotesTotal: 0,
  }),
}));

export default useRefundStore;

