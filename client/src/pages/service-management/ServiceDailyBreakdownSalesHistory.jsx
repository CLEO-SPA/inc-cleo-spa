import React from "react";
import ServiceDBSalesHistory from "@/components/service_management/ServiceDBSalesHistory";
import Navbar from "@/components/Navbar";

const ServiceDailyBreakdownSalesHistory = () => {
    return (
        <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-8xl mx-auto">
                    <ServiceDBSalesHistory />
            </div>
        </div>
        </>
    );
};

export default ServiceDailyBreakdownSalesHistory;