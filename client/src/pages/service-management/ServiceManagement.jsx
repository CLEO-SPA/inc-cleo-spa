import React from "react";
import ManageService from "@/components/service_management/ManageService";
import Navbar from "@/components/Navbar";

const ServiceManagement = () => {
    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gray-100 p-8">
                <div className="max-w-8xl mx-auto">
                    <ManageService />
                </div>
            </div>
        </>
    );
};

export default ServiceManagement;