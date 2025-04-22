import React from 'react';
import { XCircle, ChevronLeft, Home } from 'lucide-react';

const NotFoundPage = () => {
    const goBack = () => {
        window.history.back();
    };

    const goHome = () => {
        window.location.href = '/';
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
                <div className="flex justify-center mb-6">
                    <XCircle className="h-16 w-16 text-red-500" />
                </div>

                <h1 className="text-2xl font-bold text-center mb-4 text-black">
                    404 - Page Not Found
                </h1>

                <p className="text-gray-600 text-center mb-8">
                    The page you're looking for doesn't exist or has been moved.
                </p>

                <div className="flex justify-center space-x-4">
                    <button
                        onClick={goBack}
                        className="flex items-center text-black px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                    >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Go Back
                    </button>

                    <button
                        onClick={goHome}
                        className="flex items-center px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded-md transition-colors"
                    >
                        <Home className="h-4 w-4 mr-2" />
                        Go Home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotFoundPage;