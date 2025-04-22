const validateInvoiceFields = (formData) => {
    const errors = {};

    // Manual Invoice Number validation
    if (!formData.manualInvoiceNo.trim()) {
        errors.manualInvoiceNo = 'Invoice number is required';
    } else if (!/^[A-Za-z0-9-]+$/.test(formData.manualInvoiceNo)) {
        errors.manualInvoiceNo = 'Invoice number can only contain letters, numbers, and hyphens';
    }

    // Member Name validation
    if (!formData.memberName.trim()) {
        errors.memberName = 'Member name is required';
    } else if (!/^[A-Za-z\s-]+$/.test(formData.memberName)) {
        errors.memberName = 'Member name can only contain letters, spaces, and hyphens';
    }

    // Amount validations
    if (formData.totalAmount < 0) {
        errors.totalAmount = 'Total amount cannot be negative';
    }
    if (formData.paymentAmount < 0) {
        errors.paymentAmount = 'Payment amount cannot be negative';
    }
    if (formData.paymentAmount > formData.totalAmount) {
        errors.paymentAmount = 'Payment amount cannot exceed total amount';
    }

    // Date validation
    const invoiceDate = new Date(formData.invoiceDate);
    if (isNaN(invoiceDate.getTime())) {
        errors.invoiceDate = 'Invalid date format';
    }
    if (invoiceDate > new Date()) {
        errors.invoiceDate = 'Invoice date cannot be in the future';
    }

    // Status validation
    const validStatuses = ['Invoice_Unpaid', 'Invoice_Paid', 'Invoice_Partially_Paid', 'Invoice_Refund'];
    if (!validStatuses.includes(formData.status)) {
        errors.status = 'Invalid status selected';
    }

    // Remark validation (optional field)
    if (formData.invoiceRemark && formData.invoiceRemark.length > 500) {
        errors.invoiceRemark = 'Remark cannot exceed 500 characters';
    }

    return errors;
};

const sanitizeInvoiceData = (formData) => {
    return {
        ...formData,
        manualInvoiceNo: formData.manualInvoiceNo.trim(),
        memberName: formData.memberName.trim(),
        totalAmount: Number(formData.totalAmount),
        paymentAmount: Number(formData.paymentAmount),
        outstandingAmount: Number(formData.outstandingAmount),
        invoiceRemark: formData.invoiceRemark.trim()
    };
};

export { validateInvoiceFields, sanitizeInvoiceData }; 