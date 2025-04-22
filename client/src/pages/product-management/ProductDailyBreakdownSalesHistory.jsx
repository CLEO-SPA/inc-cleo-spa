import React from "react";
import ProductDBSalesHistory from "@/components/product-management/ProductDBSalesHistory";
import Navbar from "@/components/Navbar";

const ProductDailyBreakdownSalesHistory = () => {
    return (
        <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-8xl mx-auto">
                    <ProductDBSalesHistory />
            </div>
        </div>
        </>
    );
};

export default ProductDailyBreakdownSalesHistory;