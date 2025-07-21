import { create } from 'zustand';
import api from '@/services/api';
import { handleApiError } from '@/utils/errorHandlingUtils';
import { validateMembershipTypeId, validateNewMembershipTypeData } from '@/utils/validationUtils';

const getInitialState = () => ({
    loading: false,
    success: false,
    error: false,
    errorMessage: null,

    employeeList: [],
    membershipTypeList: [],
    selectedMembershipTypeId: -1,

    formData: [],
    createFormFieldData: {
        membership_type_name: '',
        default_percentage_discount_for_products: 0,
        default_percentage_discount_for_services: 0,
        created_by: ''
    },
    updateFormFieldData: {
        membership_type_name: '',
        default_percentage_discount_for_products: 0,
        default_percentage_discount_for_services: 0,
        created_by: '',
        last_updated_by: ''
    },

    isCreating: false,
    isConfirming: false,
    isUpdating: false,
    isDeleting: false,
});

const useMembershipTypeStore = create((set, get) => ({

    ...getInitialState(),

    fetchEmployeeBasicDetails: async () => {
        if (get().loading) {
            set({ success: false, error: true, errorMessage: "Another process is running." });
            return;
        };

        set({ loading: true, success: false, error: false });

        try {
            const response = await api.get(`/em/basic-details`);

            const employeeList = response.data.data;

            set({
                loading: false,
                error: false,
                success: true,
                errorMessage: null,

                employeeList: employeeList,
            });

            get().setSuccessWithTimeout();

        } catch (error) {
            const errorMessage = handleApiError(error);
            set({ error: true, errorMessage: errorMessage, loading: false });
        }
    },


    fetchAllMembershipType: async () => {

        set({ loading: true, success: false, error: false });

        try {
            // Change to no pagination
            const response = await api.get(`/membership-type/get`);
            const membershipTypeList = response.data.data;

            set((state) => ({
                ...state,
                loading: false,
                success: true,
                error: false,
                errorMessage: null,
                membershipTypeList: membershipTypeList
            }));

            get().setSuccessWithTimeout();

        } catch (error) {
            const errorMessage = handleApiError(error);
            set({ error: true, errorMessage: errorMessage, loading: false });
        }
    },

    createMembershipType: async () => {

        if (get().loading) {
            set({ success: false, error: true, errorMessage: "Another process is running." });
            return;
        };

        set({ loading: true, success: false, error: false });

        try {

            const state = get();
            const { formData } = state;

            await api.post(`/membership-type/create`, formData);
            console.log("Membership created successfully");
            set({
                isConfirming: false,
                isCreating: false,
                loading: false,
                success: true,
                formData: [],
                createFormFieldData: {
                    membership_type_name: '',
                    default_percentage_discount_for_products: 0,
                    default_percentage_discount_for_services: 0,
                    created_by: ''
                },
            });

            await get().initialize();

            get().setSuccessWithTimeout();

        } catch (error) {
            const errorMessage = handleApiError(error);
            set({ isConfirming: false, error: true, errorMessage: errorMessage, loading: false });
        }
    },

    updateMembershipType: async () => {

        if (get().loading) {
            set({ success: false, error: true, errorMessage: "Another process is running." });
            return;
        };

        set({ loading: true, success: false, error: false });

        try {

            const state = get();
            const { selectedMembershipTypeId, formData } = state;

            await api.put(`/membership-type/${selectedMembershipTypeId}/update`, formData);
            console.log("Membership updated successfully");

            set({
                isConfirming: false,
                isUpdating: false,
                loading: false,
                success: true,
                formData: [],
                updateFormFieldData: {
                    membership_type_name: '',
                    default_percentage_discount_for_products: 0,
                    default_percentage_discount_for_services: 0,
                    created_by: '',
                    last_updated_by: ''
                },
            });


            await get().initialize();

            get().setSuccessWithTimeout();

        } catch (error) {
            const errorMessage = handleApiError(error);
            set({ isConfirming: false, error: true, errorMessage: errorMessage, loading: false });
        }
    },

    deleteMembershipType: async () => {

        if (get().loading) {
            set({ success: false, error: true, errorMessage: "Another process is running." });
            return;
        };

        set({ loading: true, success: false, error: false });

        try {
            await api.delete(`/membership-type/${get().selectedMembershipTypeId}/delete`);
            console.log("Membership deleted successfully");

            set({
                isConfirming: false,
                isDeleting: false,
                loading: false,
                success: true,
                formData: []
            });

            await get().initialize();


            get().setSuccessWithTimeout();

        } catch (error) {
            const errorMessage = handleApiError(error);
            set({ isConfirming: false, isDeleting: false, error: true, errorMessage: errorMessage, loading: false });
        }
    },

    setIsCreating: (value) => { set({ isCreating: value }) },
    setIsUpdating: (value) => { set({ isUpdating: value }) },
    setIsDeleting: (value) => { set({ isDeleting: value }) },
    setIsConfirming: (value) => { set({ isConfirming: value }) },
    setSelectedMembershipTypeId: (id) => {
        const validation = validateMembershipTypeId(id);
        if (validation.isValid) {
            set({ selectedMembershipTypeId: id });
            return true;
        }

        set({ error: true, errorMessage: validation.error });
        return false;
    },

    setError: (value) => { set({ error: value }) },

    setErrorMessage: (value) => { set({ errorMessage: value }) },

    setStoreFormData: (formFieldData) => {
        const state = get();
        const { employeeList } = state;
        const validate = validateNewMembershipTypeData(formFieldData);

        if (!validate.isValid) {
            set({
                error: true,
                errorMessage: validate.error
            });
            return false;
        };

        const created_by_with_name = employeeList.find(emp => emp.id === String(formFieldData.created_by))?.employee_name || 'Unknown';

        let formFieldDataWithEmpName;

        if (formFieldData.last_updated_by) {
            const last_updated_by_with_name = employeeList.find(emp => emp.id === String(formFieldData.last_updated_by))?.employee_name || 'Unknown';
            formFieldDataWithEmpName = {
                ...formFieldData,
                created_by_with_name,
                last_updated_by_with_name
            };
        } else {
            formFieldDataWithEmpName = {
                ...formFieldData,
                created_by_with_name
            };
        }

        // No error
        console.log("Set Form Success");
        set({
            formData: formFieldDataWithEmpName
        });
        return true;
    },

    updateCreateFormField: (field, value) => {
        set((state) => ({
            createFormFieldData: { ...state.createFormFieldData, [field]: value }
        }));
    },

    clearCreateFormData: () => {
        set({
            createFormFieldData: {
                membership_type_name: '',
                default_percentage_discount_for_products: 0,
                default_percentage_discount_for_services: 0,
                created_by: ''
            }
        });
    },

    updateUpdateFormField: (field, value) => {
        set((state) => ({
            updateFormFieldData: { ...state.updateFormFieldData, [field]: value }
        }));
    },

    clearUpdateFormData: () => {
        set({
            updateFormFieldData: {
                membership_type_name: '',
                default_percentage_discount_for_products: 0,
                default_percentage_discount_for_services: 0,
                created_by: '',
                last_updated_by: ''
            }
        });
    },

    setUpdateFormData: () => {
        const state = get();
        const { membershipTypeList, selectedMembershipTypeId } = state;
        const membershipType = membershipTypeList.find(log => log.id === selectedMembershipTypeId);

        set({
            updateFormFieldData: {
                membership_type_name: membershipType.membership_type_name,
                default_percentage_discount_for_products: membershipType.default_percentage_discount_for_products,
                default_percentage_discount_for_services: membershipType.default_percentage_discount_for_services,
                created_by: membershipType.created_by,
                last_updated_by: membershipType.last_updated_by
            }
        });
    },

    setDeleteFormData: () => {
        const state = get();
        const { membershipTypeList, employeeList, selectedMembershipTypeId } = state;
        const membershipType = membershipTypeList.find(log => log.id === selectedMembershipTypeId);

        const created_by_with_name = employeeList.find(emp => emp.id === String(membershipType.created_by))?.employee_name || 'Unknown';

        set({
            formData: {
                membership_type_name: membershipType.membership_type_name,
                default_percentage_discount_for_products: membershipType.default_percentage_discount_for_products,
                default_percentage_discount_for_services: membershipType.default_percentage_discount_for_services,
                created_by_with_name: created_by_with_name
            },
            isDeleting: true,
            isConfirming: true
        });
    },

    initialize: async () => {
        await get().fetchEmployeeBasicDetails();
        await get().fetchAllMembershipType();
    },

    clearError: () => {
        set({ error: false, errorMessage: null })
    },

    setSuccessWithTimeout: () => {
        set({ success: true, error: false, errorMessage: null });

        // Auto-clear success message after 3 seconds (data stays)
        setTimeout(() => {
            set((state) => ({
                ...state,
                success: false  // Only clear the success flag, keep data
            }));
        }, 3000);
    },

    reset: () => set(getInitialState())

}));

export default useMembershipTypeStore;