const ConfirmationPopUp = ({ 
    open, 
    title, 
    body, 
    onConfirm, 
    onCancel 
}) => {

    if (!open) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{backgroundColor: 'rgba(0, 0, 0, 0.5)'}}>
            <div className="bg-white p-6 rounded shadow-md w-[90%] max-w-lg">
                <h2 className="text-lg font-semibold mb-4">
                    {title || 'Are you sure?'}
                </h2>

                <div className="mb-6 space-y-2">
                    {body}
                </div>

                <div className="flex justify-end space-x-2">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 border rounded"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-blue-600 text-white rounded"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationPopUp;