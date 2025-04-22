import React from "react";
import ServiceStatisticsReport from "@/components/service_management/ServiceStatisticsReport";
import Navbar from "@/components/Navbar";

const ServiceStatistics = () => {
    return (
        <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-8xl mx-auto">
                    <ServiceStatisticsReport />
            </div>
        </div>
        </>
    );
};

export default ServiceStatistics;