import React from "react";
import CreateProductForm from "@/components/product-management/CreateProductForm";
import Navbar from "@/components/Navbar";

const CreateProduct = () => {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-blue-50 p-8">
        <div className="max-w-5xl mx-auto">
          <CreateProductForm />
        </div>
      </div>
    </>
  );
};

export default CreateProduct;