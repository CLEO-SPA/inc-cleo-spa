import React from 'react';

const Pagination = ({ totalPages, currentPage, onPageChange }) => {
    const handleClick = (page) => {
        if (page >= 1 && page <= totalPages) {
            onPageChange(page);
        }
    };

  return (
    <div className="flex justify-center mt-4">
            <button
                onClick={() => handleClick(currentPage - 1)}
                className="px-3 py-1 mx-1 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100"
                disabled={currentPage === 1}
            >
                Previous
            </button>
            {[...Array(totalPages)].map((_, index) => (
                <button
                    key={index}
                    onClick={() => handleClick(index + 1)}
                    className={`px-3 py-1 mx-1 text-gray-700 border rounded-md ${
                        currentPage === index + 1
                            ? "bg-gray-400 text-white"
                            : "bg-white border-gray-300 hover:bg-gray-100"
                    }`}
                >
                    {index + 1}
                </button>
            ))}
            <button
                onClick={() => handleClick(currentPage + 1)}
                className="px-3 py-1 mx-1 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100"
                disabled={currentPage === totalPages}
            >
                Next
            </button>
        </div>
    );
};

export default Pagination;