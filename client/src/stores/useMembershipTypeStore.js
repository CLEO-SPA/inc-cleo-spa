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

    getNameById(empMap, id) {
        for (let [name, empId] of empMap) {
            if (empId === id) {
                return name;
            }
        }
        return null;
    },

    fetchEmployeeBasicDetails: async () => {
        if (get().loading) {
            set({ success: false, error: true, errorMessage: "Another process is running." });
            return;
        };

        set({ loading: true, success: false, error: false });

        try {
            const response = await api.get(`/em/basic-details`);

            const employeeList = response.data.data;

            const empMap = new Map();
            employeeList.forEach(emp => {
                empMap.set(emp.employee_name.toLowerCase(), emp.id);
            });

            set({
                loading: false,
                error: false,
                success: true,
                errorMessage: null,

                employeeList: empMap,
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
            const { formData, employeeList } = state;

            const formDataWithEmployeeId = {
                ...formData,
                created_by: employeeList.get(formData.created_by.toLowerCase()),
            };

            console.log("fetch function form data: ");
            console.log(formDataWithEmployeeId);

            await api.post(`/membership-type/create`, formDataWithEmployeeId);
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
            const { selectedMembershipTypeId, formData, employeeList } = state;

            const formDataWithEmployeeId = {
                ...formData,
                created_by: employeeList.get(formData.created_by.toLowerCase()),
                last_updated_by: employeeList.get(formData.last_updated_by.toLowerCase()),
            };

            console.log("fetch function form data: ");
            console.log(formDataWithEmployeeId);

            await api.put(`/membership-type/${selectedMembershipTypeId}/update`, formDataWithEmployeeId);
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
            console.log(validate.error);
            set({
                error: true,
                errorMessage: validate.error
            });
            return false;
        };

        const validateCreatedBy = employeeList.get(formFieldData.created_by.toLowerCase());

        if (!validateCreatedBy) {
            set({
                error: true,
                errorMessage: "This Employee does not exist. Please try again."
            });
            return false;
        };

        if (formFieldData.last_updated_by) {
            const validateLastUpdatedBy = employeeList.get(formFieldData.last_updated_by.toLowerCase());

            if (!validateLastUpdatedBy) {
                set({
                    error: true,
                    errorMessage: "This Employee does not exist. Please try again."
                });
                return false;
            };
        };

        // No error
        console.log("Set Form Success");
        set({
            formData: formFieldData
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
        const { membershipTypeList, employeeList, selectedMembershipTypeId, getNameById } = state;
        const membershipType = membershipTypeList.find(log => log.id === selectedMembershipTypeId);

        const createdByEmpName = getNameById(employeeList, String(membershipType.created_by));
        const lastUpdatedByEmpName = getNameById(employeeList, String(membershipType.last_updated_by));

        set({
            updateFormFieldData: {
                membership_type_name: membershipType.membership_type_name,
                default_percentage_discount_for_products: membershipType.default_percentage_discount_for_products,
                default_percentage_discount_for_services: membershipType.default_percentage_discount_for_services,
                created_by: createdByEmpName,
                last_updated_by: lastUpdatedByEmpName
            }
        });
    },

    setDeleteFormData: () => {
        const state = get();
        const { membershipTypeList, employeeList, selectedMembershipTypeId, getNameById } = state;
        const membershipType = membershipTypeList.find(log => log.id === selectedMembershipTypeId);

        const createdByEmpName = getNameById(employeeList, String(membershipType.created_by));
        const lastUpdatedByEmpName = getNameById(employeeList, String(membershipType.last_updated_by));

        set({
            formData: {
                membership_type_name: membershipType.membership_type_name,
                default_percentage_discount_for_products: membershipType.default_percentage_discount_for_products,
                default_percentage_discount_for_services: membershipType.default_percentage_discount_for_services,
                created_by: createdByEmpName,
                last_updated_by: lastUpdatedByEmpName
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