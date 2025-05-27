import * as React from 'react';
import ConfirmationPopUp from './confirmationPopUp';
import MembershipTypeUpdateForm from './membershipTypeUpdateForm';
import useMembershipTypeStore from '@/stores/useMembershipTypeStore';

const MembershipTypeTable = () => {
    const {
        membershipTypeList,
        loading,
        isUpdating,
        setSelectedMembershipTypeId,
        setIsUpdating,
        getMembershipTypeById,
        deleteMembershipType,
        selectedMembershipTypeId
    } = useMembershipTypeStore();

    const [showConfirm, setShowConfirm] = useState(false);
    const [formValues, setFormValues] = useState({});

    const handleDelete = async (data) => {
        console.log("Delete Data: " + data);

        setFormValues(data);
        setShowConfirm(true);
    };

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

    if (loading) {
        return <div className="text-center p-4">Loading...</div>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse">
                <thead>
                    <tr className="bg-gray-50">
                        <th className="p-3 text-left border">ID</th>
                        <th className="p-3 text-left border">Membership Type Name</th>
                        <th className="p-3 text-left border">Default Services Discount (%)</th>
                        <th className="p-3 text-left border">Default Products Discount (%)</th>
                        <th className="p-3 text-center border">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {membershipTypeList.map((type, index) => (
                        <tr key={type.membership_type_id} className="hover:bg-gray-50">
                            <td className="p-3 border">{index + 1}</td>
                            <td className="p-3 border">{type.membership_type_name}</td>
                            <td className="p-3 border">{type.default_percentage_services_discount}%</td>
                            <td className="p-3 border">{type.default_percentage_products_discount}%</td>
                            <td className="p-3 border">
                                <div className="flex justify-center gap-2">
                                    <button
                                        onClick={() => {
                                            setSelectedMembershipTypeId(type.membership_type_id);
                                            setIsUpdating(true);
                                        }}
                                        className="border border-gray-300 py-1 px-3 rounded text-sm hover:bg-gray-50"
                                    >
                                        Update
                                    </button>
                                    <button
                                        className="bg-red-600 text-white py-1 px-3 rounded text-sm hover:bg-red-700"
                                        onClick={() => {
                                            handleDelete(getMembershipTypeById(type.membership_type_id));
                                        }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {isUpdating && <MembershipTypeUpdateForm />}
            
            <ConfirmationPopUp
                open={showConfirm}
                title="Warning! Are you sure you wish to delete the following entry:"
                body={confirmBody}
                onCancel={() => setShowConfirm(false)}
                onConfirm={() => {
                    setShowConfirm(false);
                    deleteMembershipType(selectedMembershipTypeId);
                }}
            />
        </div>
    );
}

export default MembershipTypeTable;