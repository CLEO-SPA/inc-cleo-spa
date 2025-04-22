import React from "react";
import CustomerFollowupComponent from "@/components/customer/CustomerFollowUpComponent.jsx";
import Navbar from "@/components/Navbar";

const CustomerFollowups = () => {
    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gray-50 p-8">
                <div className="max-w-8xl mx-auto">
                    <CustomerFollowupComponent />
                </div>
            </div>
        </>
    );
};

export default CustomerFollowups;