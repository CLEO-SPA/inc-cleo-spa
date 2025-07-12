import { handleSystemError } from "./errorHandlingUtils";

export const validateNewMembershipTypeData = (obj) => {
    try {
        if (!obj.membership_type_name?.trim()) {
            return { isValid: false, error: "Membership type name is required" };
        };
        if (obj.membership_type_name.length > 100) {
            return { isValid: false, error: "Membership type name is too long" };
        };
        if (obj.default_percentage_discount_for_products < 0 ||
            obj.default_percentage_discount_for_products > 100) {
            return { isValid: false, error: "Product discount must be between 0-100%" };
        };
        if (obj.default_percentage_discount_for_services < 0 ||
            obj.default_percentage_discount_for_services > 100) {
            return { isValid: false, error: "Service discount must be between 0-100%" };
        };
        return { isValid: true, error: "No Errors" };
    } catch (error) {
        return { isValid: false, error: handleSystemError(error) };
    };
};

export const validateMembershipTypeId = (id) => {
    try {
        if (!id) {
            return { isValid: false, error: "Membership type id is required" };
        };
        if (isNaN(Number(id))) {
            return { isValid: false, error: "Invalid Membership type id. Please try again later." };
        };
        return { isValid: true, error: "No Errors" }; // No errors
    } catch (error) {
        return { isValid: false, error: handleSystemError(error) };
    };
};

export const validateMemberVoucherId = (id) => {
    try {
        if (!id) {
            return { isValid: false, error: "Member Voucher id is required" };
        };
        if (isNaN(Number(id))) {
            return { isValid: false, error: "Invalid Member Voucher id. Please try again later." };
        };
        return { isValid: true, error: "No Errors" }; // No errors
    } catch (error) {
        return { isValid: false, error: handleSystemError(error) };
    };
};

export const validateTransactionLogId = (id) => {
    try {
        if (!id) {
            return { isValid: false, error: "Member Voucher Transaction Log id is required" };
        };

        if (isNaN(Number(id))) {
            return { isValid: false, error: "Invalid Member Voucher Transaction Log id. Please try again later." };
        };
        return { isValid: true, error: "No Errors" }; // No errors
    } catch (error) {
        return { isValid: false, error: handleSystemError(error) };
    };
};

export const validateMemberVoucherConsumptionCreateData = (formData, minDate) => {
    try {
        const numValue = Number(formData.consumptionValue);
        if ((formData.consumptionValue === '' || formData.consumptionValue == null) || Number.isNaN(numValue)) {
            return { isValid: false, error: "Consumption value is invalid. Please enter a valid input" };
        }
        if (formData.remarks.length > 500) {
            return { isValid: false, error: "Remarks input is too long. Please try again." };
        };

        if (!formData.date || !/^\d{4}-\d{2}-\d{2}$/.test(formData.date)) {
            return { isValid: false, error: "Date input is invalid. Please try again." };
        };

        const inputDate = new Date(`${formData.date}T${formData.time}`);

        if (inputDate < minDate) {
            return { isValid: false, error: "Date & Time input is before purchase date. Please try again." };
        };

        if (!formData.type) {
            return { isValid: false, error: "Missing Type input. Please try again." };
        };
        if (!formData.createdBy) {
            return { isValid: false, error: "Created By input is missing. Please try again." };
        };
        if (!formData.handledBy) {
            return { isValid: false, error: "Handled By input is missing. Please try again." };
        };

        return { isValid: true, error: "No Errors" };
    } catch (error) {
        return { isValid: false, error: handleSystemError(error) };
    };
};

export const validateTimeInput = (value) => {
    try {
        if (!value) {
            return { isValid: false, error: "Time Input is required" };
        };
        if (isNaN(Number(value))) {
            return { isValid: false, error: "Invalid Time Input. Please input a quantity value." };
        };
        if (value <= 0) {
            return { isValid: false, error: "Invalid Time Input. Please input must be greater than 0." };
        };
        return { isValid: true, error: "No Errors" }; // No errors
    } catch (error) {
        return { isValid: false, error: handleSystemError(error) };
    }
};

export const validateForm = (
    selectedTable,
    exportFormat,
    openTimeInput,
    timeInput
) => {
    try {
        if (!selectedTable) return { isValid: false, error: "Please select a table" };

        if (!exportFormat) return { isValid: false, error: "Please select an export format" };

        if (openTimeInput && !timeInput) {
            return { isValid: false, error: "Time input is required for this selection" };
        };
        return { isValid: true, error: "No Errors" };
    } catch (error) {
        return { isValid: false, error: handleSystemError(error) };

    }
};
