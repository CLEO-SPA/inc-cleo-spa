import React, { useState } from 'react';
// import button from '@/components/ui/button';

import { NewMembershipType } from '@/types/membershipType';
import ConfirmationPopUp from './confirmationPopUp';
import useMembershipTypeStore from '@/stores/useMembershipTypeStore';

const MembershipTypeCreateForm = () => {

    const [showConfirm, setShowConfirm] = useState<boolean>(false);
    const [formValues, setFormValues] = useState<NewMembershipType>({
        membership_type_name: '',
        default_percentage_discount_for_products: 0,
        default_percentage_discount_for_services: 0,
        created_by: 0
    });

    const {
        isCreating,
        loading,
        setIsCreating,
        createMembershipType
    } = useMembershipTypeStore();

    // This is used to retrieve the form fields and set up the confirm pop-up
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data: NewMembershipType = {
            membership_type_name: formData.get('membership_type_name') as string,
            default_percentage_discount_for_products: Number(formData.get('default_percentage_discount_for_products')),
            default_percentage_discount_for_services: Number(formData.get('default_percentage_discount_for_services')),
            created_by: Number(formData.get('created_by'))
        }
        console.log(data);

        setFormValues(data);
        setShowConfirm(true);
    };

    // This is used to create the confirm pop-up body
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


    // When state is rendered, create form component will check to see if the create form has been opened.
    // If no, this will return null.
    if (!isCreating) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white rounded-lg w-1/2 flex flex-col max-h-[90vh]">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-bold">Create New Membership Type</h2>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block mb-2">Membership Type Name</label>
                            <input
                                id="membership_type_name"
                                type="text"
                                name="membership_type_name"
                                className="w-full border rounded p-2"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label className="block mb-2">Default Products Discount(%)</label>
                            <input
                                id="default_percentage_products_discount"
                                type="number"
                                name="default_discount_for_products"
                                className="w-full border rounded p-2"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label className="block mb-2">Default Services Discount(%)</label>
                            <input
                                id="default_percentage_services_discount"
                                type="number"
                                name="default_discount_percentage_for_service"
                                className="w-full border rounded p-2"
                                required
                                disabled={loading}
                            />
                        </div>

                        {/* Created By field not done. Waiting for Employee store to finish */}
                        {/* <div>
                            <label className="block mb-2">Created By</label>
                            <input
                                id="created_by"
                                type="number"
                                name="created_by"
                                className="w-full border rounded p-2"
                                required
                                disabled={loading}
                            />
                        </div> */}
                        <div className="p-6 border-t bg-gray-50">
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsCreating(false)}
                                    className="border border-gray-300 px-4 py-2 rounded bg-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    data-testid="create-membership-button"
                                    type="submit"
                                    className="bg-blue-600 text-white px-4 py-2 rounded"
                                    disabled={loading}
                                >
                                    Create
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
                    createMembershipType(formValues);
                    setIsCreating(false);
                }}
            />
        </div>
    );
};

export default MembershipTypeCreateForm;