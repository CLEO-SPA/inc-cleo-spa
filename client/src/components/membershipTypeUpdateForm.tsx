import React, { useState } from 'react';
// import button from '@/components/ui/button';

import { UpdatedMembershipType } from '../types/membershipType';
import ConfirmationPopUp from './confirmationPopUp';
import useMembershipTypeStore from '@/stores/useMembershipTypeStore';
import { validateUpdateMembershipTypeData } from '@/utils/validationUtils';
import ErrorAlert from './ui/errorAlert';

const MembershipTypeUpdateForm = () => {

    const [showConfirm, setShowConfirm] = useState<boolean>(false);
    const [formValues, setFormValues] = useState<UpdatedMembershipType>({
        id: -1,
        membership_type_name: '',
        default_percentage_discount_for_products: 0,
        default_percentage_discount_for_services: 0,
        created_by: 0,
        last_updated_by: 0
    });

    const {
        isUpdating,
        loading,
        selectedMembershipTypeId,
        error,
        errorMessage,

        setError,
        setErrorMessage,
        clearError,
        setIsUpdating,
        getMembershipTypeById,
        updateMembershipType
    } = useMembershipTypeStore();

    const selectedMembershipType = getMembershipTypeById(selectedMembershipTypeId);

    // This is used to retrieve the form fields and set up the confirm pop-up
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const validation = validateUpdateMembershipTypeData(Object.fromEntries(formData.entries()));
        if (!validation.isValid) {
            setError(true);
            setErrorMessage(validation.error);
            return;
        };


        const data: UpdatedMembershipType = {
            id: Number(selectedMembershipTypeId),
            membership_type_name: formData.get('membership_type_name') as string,
            default_percentage_discount_for_products: Number(formData.get('default_percentage_discount_for_products')),
            default_percentage_discount_for_services: Number(formData.get('default_percentage_discount_for_services')),
            created_by: 14, // Number(formData.get('membership_type_name')), // Until Employees store is merged
            last_updated_by: 14 // Number(formData.get('membership_type_name'))
        }
        console.log(data);

        setFormValues(data);
        setShowConfirm(true);
    };

    // This is used to update the confirm pop-up body
    const confirmBody = (
        <div>
            {Object.entries(formValues).map(([key, value]) => (
                <div key={key} className="flex justify-between border-b py-1">
                    <span className="font-medium">{key}</span>
                    <span>{value || '—'}</span>
                </div>
            ))}
        </div>
    );


    // When state is rendered, update form component will check to see if the update form has been opened.
    // If no, this will return null.
    if (!isUpdating) return null;

    // Ensure that there is no null values displayed before the getMembershipTypeById is done
    if (!selectedMembershipType) {
        return (
            <div className="fixed inset-0 flex justify-center items-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                <div className="bg-white p-6 rounded">
                    <p>Loading membership data...</p>
                    <button onClick={() => setIsUpdating(false)}>Cancel</button>
                </div>
            </div>
        );
    }
    return (
        <div className="fixed inset-0 flex justify-center items-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <div className="bg-white rounded-lg w-1/2 flex flex-col max-h-[90vh]">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-bold">Update Form</h2>
                </div>

                <div className="p-6 overflow-y-auto flex-1">

                    {/* Error Alert */}
                    {error && <ErrorAlert
                        error={error}
                        errorMessage={errorMessage}
                        onClose={clearError}
                    />}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block mb-2">Membership Type Name</label>
                            <input
                                id="membership_type_name"
                                type="text"
                                name="membership_type_name"
                                defaultValue={selectedMembershipType.membership_type_name}
                                className="w-full border rounded p-2"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label className="block mb-2">Default Products Discount(%)</label>
                            <input
                                id="default_percentage_discount_for_products"
                                type="number"
                                name="default_percentage_discount_for_products"
                                defaultValue={selectedMembershipType.default_percentage_discount_for_products}
                                className="w-full border rounded p-2"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label className="block mb-2">Default Services Discount(%)</label>
                            <input
                                id="default_percentage_discount_for_services"
                                type="number"
                                name="default_percentage_discount_for_services"
                                defaultValue={selectedMembershipType.default_percentage_discount_for_services}
                                className="w-full border rounded p-2"
                                required
                                disabled={loading}
                            />
                        </div>

                        {/* created_by and last_updated_by fields still need to be added. Waiting for Employee store to finish*/}

                        {/* <div>
                            <label className="block mb-2">Created By</label>
                            <input
                                id="default_percentage_products_discount"
                                type="number"
                                name="default_discount_for_products"
                                defaultValue={validatedSelectedMembershipType.default_percentage_discount_for_products}
                                className="w-full border rounded p-2"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label className="block mb-2">Updated By</label>
                            <input
                                id="default_percentage_services_discount"
                                type="number"
                                name="default_discount_percentage_for_service"
                                defaultValue={validatedSelectedMembershipType.default_percentage_discount_for_services}
                                className="w-full border rounded p-2"
                                required
                                disabled={loading}
                            />
                        </div> */}

                        <div className="p-6 border-t bg-gray-50">
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsUpdating(false)}
                                    className="border border-gray-300 px-4 py-2 rounded bg-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    data-testid="update-membership-button"
                                    type="submit"
                                    className="bg-blue-600 text-white px-4 py-2 rounded"
                                    disabled={loading}
                                >
                                    Update
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            <ConfirmationPopUp
                open={showConfirm}
                title="Please confirm your input"
                body={confirmBody}
                onCancel={() => setShowConfirm(false)}
                onConfirm={() => {
                    setShowConfirm(false);
                    updateMembershipType(formValues);
                }}
            />
        </div>
    );
};

export default MembershipTypeUpdateForm;