import React from "react";
import ServiceSequence from "@/components/service_management/ServiceSequence";
import Navbar from "@/components/Navbar";

const UpdateServiceSequence = () => {
  return (
    <>
    <Navbar />
    <div className="min-h-screen bg-blue-50 p-8">
      <div className="max-w-5xl mx-auto">
        <ServiceSequence />
      </div>
    </div>
    </>
    
  );
};

export default UpdateServiceSequence;