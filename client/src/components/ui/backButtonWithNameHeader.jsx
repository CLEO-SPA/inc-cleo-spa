import { ArrowLeft } from "lucide-react";

const BackButtonHeader = ({ name="Customer", onBack }) => {
    const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      // Go back to previous page in browser history
      window.history.back();
    }
  };

  return (
    <div className="flex items-center gap-3 p-4 bg-white">
      {/* Back Button */}
      <button
        onClick={handleBack}
        className="flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded transition-colors duration-200"
        aria-label="Go back"
      >
        <ArrowLeft className="w-5 h-5 text-gray-600" />
      </button>
      
      {/* Name Box */}
      <div className="bg-gray-100 px-4 py-2 rounded text-gray-800 font-medium">
        {name}
      </div>
    </div>
  );
};

export default BackButtonHeader;