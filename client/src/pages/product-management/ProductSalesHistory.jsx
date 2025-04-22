import React from "react";
import ProductMonthlySalesHistory from "@/components/product-management/ProductMonthlySalesHistory";
import Navbar from "@/components/Navbar";

const ProductSalesHistory = () => {
    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gray-50 p-8">
                <div className="max-w-8xl mx-auto">
                    <ProductMonthlySalesHistory />
                </div>
            </div>
        </>
    );
};

export default ProductSalesHistory;