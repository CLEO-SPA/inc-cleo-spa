import React from "react";
import ProductStatisticsReport from "@/components/product-management/ProductStatisticsReport";
import Navbar from "@/components/Navbar";

const ProductStatistics = () => {
    return (
        <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-8xl mx-auto">
                    <ProductStatisticsReport />
            </div>
        </div>
        </>
    );
};

export default ProductStatistics;