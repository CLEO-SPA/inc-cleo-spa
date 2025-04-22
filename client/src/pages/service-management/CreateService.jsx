import React from "react";
import ServiceForm from "@/components/service_management/ServiceForm";
import Navbar from "@/components/Navbar";

const CreateService = () => {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-blue-50 p-8">
        <div className="max-w-5xl mx-auto">
          <ServiceForm />
        </div>
      </div>
    </>

  );
};

export default CreateService;