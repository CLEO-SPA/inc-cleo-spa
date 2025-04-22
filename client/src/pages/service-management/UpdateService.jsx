import React from "react";
import UpdateServiceForm from "@/components/service_management/UpdateServiceForm";
import Navbar from "@/components/Navbar";

const UpdateService = () => {
    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gray-50 p-8">
                <div className="max-w-5xl mx-auto">
                    <UpdateServiceForm />
                </div>
            </div>
        </>
    );
};

export default UpdateService;