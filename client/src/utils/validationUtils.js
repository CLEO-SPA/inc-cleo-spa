import { handleSystemError } from "./errorHandlingUtils";

export const validateNewMembershipTypeData = (obj) => {
    console.log(obj)
    try {
        if (!obj.membership_type_name?.trim()) {
            return { isValid: false, error: "Membership type name is required" };
        }

        if (obj.membership_type_name.length > 100) {
            return { isValid: false, error: "Membership type name is too long" };
        }

        if (obj.default_percentage_discount_for_products < 0 ||
            obj.default_percentage_discount_for_products > 100) {
            return { isValid: false, error: "Product discount must be between 0-100%" };
        }

        if (obj.default_percentage_discount_for_services < 0 ||
            obj.default_percentage_discount_for_services > 100) {
            return { isValid: false, error: "Service discount must be between 0-100%" };
        }

        // tested and works
        // if (!obj.created_by) {
        //     return { isValid: false, error: "Created By is required" };
        // }

        // if (isNaN(Number(obj.created_by))) {
        //     return { isValid: false, error: "Invalid Employee. Please try again." };
        // }

        return { isValid: true, error: "No Errors" };
    } catch (error) {
        return { isValid: false, error: handleSystemError(error) };
    };
};

export const validateUpdateMembershipTypeData = (obj) => {
    try {
        if (!obj.membership_type_name?.trim()) {
            return { isValid: false, error: "Membership type name is required" };
        }

        if (obj.membership_type_name.length > 100) {
            return { isValid: false, error: "Membership type name is too long" };
        }

        if (obj.default_percentage_discount_for_products < 0 ||
            obj.default_percentage_discount_for_products > 100) {
            return { isValid: false, error: "Product discount must be between 0-100%" };
        }

        if (obj.default_percentage_discount_for_services < 0 ||
            obj.default_percentage_discount_for_services > 100) {
            return { isValid: false, error: "Service discount must be between 0-100%" };
        }

        // tested and works
        // if (!obj.created_by) {
        //     return { isValid: false, error: "Created By is required" };

        // }

        // if (isNaN(Number(obj.created_by))) {
        //     return { isValid: false, error: "Invalid Employee. Please try again." };

        // }

        // if (!obj.last_updated_by) {
        //     return { isValid: false, error: "Last Updated By is required" };

        // }

        // if (isNaN(Number(obj.last_updated_by))) {
        //     return { isValid: false, error: "Invalid Employee. Please try again." };

        // }

        return { isValid: true, error: "No Errors" };
    } catch (error) {
        return { isValid: false, error: handleSystemError(error) };
    };
};

export const validateMembershipTypeId = (id) => {
    try {
        if (!id) {
            return { isValid: false, error: "Membership type id is required" };
        }

        if (isNaN(Number(id))) {
            return { isValid: false, error: "Invalid Membership type id. Please try again later." };
        }

        return { isValid: true, error: "No Errors" }; // No errors
    } catch (error) {
        return { isValid: false, error: handleSystemError(error) };
    }
};

export const validateTimeInput = (value) => {
    try {
        if (!value) {
            return { isValid: false, error: "Time Input is required" };
        }

        if (isNaN(Number(value))) {
            return { isValid: false, error: "Invalid Time Input. Please input a quantity value." };
        }

        if (value <= 0) {
            return { isValid: false, error: "Invalid Time Input. Please input must be greater than 0." };
        }

        return { isValid: true, error: "No Errors" }; // No errors
    } catch (error) {
        return { isValid: false, error: handleSystemError(error) };
    }
};

export const validateForm = (
    selectedTable,
    exportFormat,
    isSelectingUnusedMemberVoucher,
    isSelectingUnusedMemberCarePackage,
    timeInput
) => {

    if (!selectedTable) return { isValid: false, error: "Please select a table" };
    if (!exportFormat) return { isValid: false, error: "Please select an export format" };

    if ((isSelectingUnusedMemberVoucher || isSelectingUnusedMemberCarePackage) && !timeInput) {
        return { isValid: false, error: "Time input is required for this selection" };
    };

    return { isValid: true, error: "No Errors" };
};
