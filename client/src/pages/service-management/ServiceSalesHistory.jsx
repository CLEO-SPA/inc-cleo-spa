import React from "react";
import ServiceMonthlySalesHistory from "@/components/service_management/ServiceMonthlySalesHistory";
import Navbar from "@/components/Navbar";

const ServiceSalesHistory = () => {
    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gray-50 p-8">
                <div className="max-w-8xl mx-auto">
                    <ServiceMonthlySalesHistory />
                </div>
            </div>
        </>
    );
};

export default ServiceSalesHistory;