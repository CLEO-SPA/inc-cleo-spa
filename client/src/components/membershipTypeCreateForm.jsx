import * as React from 'react';
// import button from '@/components/ui/button';
import ConfirmationPopUp from './confirmationPopUp';
import useMembershipTypeStore from '@/stores/useMembershipTypeStore';

const MembershipTypeCreateForm = () => {

    const [showConfirm, setShowConfirm] = useState(false);
    const [formValues, setFormValues] = useState({});

    const {
        isCreating,
        loading,
        setIsCreating,
        createMembershipType
    } = useMembershipTypeStore;

    // Used for form reset without changing state
    const formRef = React.useRef();

    // This is used to retrieve the form fields and set up the confirm pop-up
    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
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
                        {/* NOT DONE STILL HAVE FIELDS */}
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
                    formRef.current.reset(); // form reset after creation
                }}
            />
        </div>
    );
};

export default MembershipTypeCreateForm;