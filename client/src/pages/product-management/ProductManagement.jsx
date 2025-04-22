import React from "react";
import ManageProduct from "@/components/product-management/ManageProduct";
import Navbar from "@/components/Navbar";

const ProductManagement = () => {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-8xl mx-auto">
          <ManageProduct />
        </div>
      </div>
    </>
  );
};

export default ProductManagement;