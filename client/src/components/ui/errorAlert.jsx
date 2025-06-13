const ErrorAlert = ({ error, errorMessage, onClose }) => {
  if (!error || !errorMessage) return null;

  return (
    <div className="mx-6 my-1 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex justify-between items-center">
      <span className="text-sm">{errorMessage}</span>
      {onClose && (
        <button 
          onClick={onClose}
          className="text-red-700 hover:text-red-900 font-bold text-lg"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default ErrorAlert;