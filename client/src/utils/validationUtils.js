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

export const validateMemberVoucherId = (id) => {
    try {
        if (!id) {
            return { isValid: false, error: "Member Voucher id is required" };

        }

        if (isNaN(Number(id))) {
            return { isValid: false, error: "Invalid Member Voucher id. Please try again later." };

        }

        return { isValid: true, error: "No Errors" }; // No errors
    } catch (error) {
        return { isValid: false, error: handleSystemError(error) };
    }
};

export const validateMemberVoucherConsumptionCreateData = (formData) => {
    try {
        if (!formData.consumptionValue || Number.isNaN(Number(formData.consumptionValue))) {
            return { isValid: false, error: "Consumption value is invalid. Please enter a valid input" };
        }
        if (formData.remarks.length > 500) {
            return { isValid: false, error: "Remarks input is too long. Please try again." };
        }
        if (!formData.date || !(typeof formData.date === 'string') || !/^\d{4}-\d{2}-\d{2}$/.test(formData.date)) {
            console.log("formData format failed? : " + !/^\d{4}-\d{2}-\d{2}$/.test(formData.date));
            return { isValid: false, error: "Date input is invalid. Please try again." };
        }

        const regex = /^([01]\d|2[0-3]):([0-5]\d)$/; 
        if (!formData.time || !regex.test(formData.time)) {
            return { isValid: false, error: "Time input is invalid. Please try again." };
        }
        if (!formData.createdBy || !(typeof formData.createdBy === 'string')) {
            return { isValid: false, error: "Created By input is invalid. Please try again." };
        }
        if (!formData.handledBy || !(typeof formData.handledBy === 'string')) {
            return { isValid: false, error: "Handled By input is invalid. Please try again." };
        }
        return { isValid: true, error: "No Errors" }
    } catch (error) {
        return { isValid: false, error: handleSystemError(error) };
    }
}