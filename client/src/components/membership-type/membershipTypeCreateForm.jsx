import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import EmployeeSelect from '../ui/forms/EmployeeSelect';
import useMembershipTypeStore from '@/stores/useMembershipTypeStore';
import ErrorAlert from '../ui/errorAlert';

const MembershipTypeCreateForm = () => {
    const {
        createFormFieldData,
        isCreating,
        error,
        errorMessage,
        loading,

        clearError,
        setIsCreating,
        setIsConfirming,
        setStoreFormData,
        updateCreateFormField,
        clearCreateFormData
        // createMembershipType
    } = useMembershipTypeStore();

    const handleInputChange = (field, value) => {
        updateCreateFormField(field, value);
    };

    const handleSubmit = () => {
        if (setStoreFormData(createFormFieldData)) {
            setIsConfirming(true);
        };
    };

    const handleClear = () => {
        clearCreateFormData();
    };

    const handleClose = () => {
        setIsCreating(false);
    };

    // When state is rendered, create form component will check to see if the create form has been opened.
    // If no, this will return null.
    if (!isCreating) return null;

    return (
        <div className="fixed inset-0 flex justify-center items-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                {/* Error Alert */}
                {error && <ErrorAlert
                    error={error}
                    errorMessage={errorMessage}
                    onClose={clearError}
                />}
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Create New Membership Type</h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-500 hover:text-gray-700 text-xl font-bold"
                    >
                        ×
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <Label htmlFor="membership_type_name" className="block mb-2">
                            Membership Type Name
                        </Label>
                        <Input
                            id="membership_type_name"
                            type="text"
                            value={createFormFieldData.membership_type_name}
                            onChange={(e) => handleInputChange('membership_type_name', e.target.value)}
                            placeholder="Enter Membership Type Name"
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="default_percentage_discount_for_products" className="block mb-2">
                            Default Products Discount(%)
                        </Label>
                        <Input
                            id="default_percentage_discount_for_products"
                            type="number"
                            value={createFormFieldData.default_percentage_discount_for_products}
                            onChange={(e) => handleInputChange('default_percentage_discount_for_products', e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="default_percentage_discount_for_services" className="block mb-2">
                            Default Services Discount(%)
                        </Label>
                        <Input
                            id="default_percentage_discount_for_services"
                            type="number"
                            value={createFormFieldData.default_percentage_discount_for_services}
                            onChange={(e) => handleInputChange('default_percentage_discount_for_services', e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <EmployeeSelect
                            label='Created By'
                            value={createFormFieldData.created_by}
                            onChange={(value) => handleInputChange('created_by', value)}
                            disabled={loading}
                        />
                    </div>

                    <div className="flex gap-2 pt-4">
                        <Button variant="outline" onClick={handleClear} className="flex-1">
                            Clear
                        </Button>

                        <Button onClick={handleSubmit} className="flex-1">
                            Submit
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MembershipTypeCreateForm;