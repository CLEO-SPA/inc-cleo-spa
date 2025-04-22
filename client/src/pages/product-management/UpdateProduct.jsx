import React from "react";
import UpdateProductForm from "@/components/product-management/UpdateProductForm";
import Navbar from "@/components/Navbar";

const UpdateProduct = () => {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-5xl mx-auto">
          <UpdateProductForm />
        </div>
      </div>
    </>
  );
};

export default UpdateProduct;