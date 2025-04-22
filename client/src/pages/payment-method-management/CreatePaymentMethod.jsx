import { useState } from "react";
import { api } from "@/interceptors/axios";
import { toaster } from "@/components/ui/toaster";
import Navbar from "@/components/Navbar";
import { Switch } from "@/components/ui/switch";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

const CreatePaymentMethod = () => {
  const [formValues, setFormValues] = useState({
    payment_method_name: "",
    is_active: true,
    is_used_to_create_pending_invoice: false,
    is_used_to_deduct_from_package: false,
    is_revenue: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    let errors = {};
    if (!formValues.payment_method_name.trim()) {
      errors.payment_method_name = "Payment method name is required.";
    }
    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSwitchChange = (name) => {
    setFormValues((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const response = await api.post("/pm", formValues);
      if (response.status === 201) {
        toaster.create({
          title: "Payment Method Created",
          description: `Payment method "${response.data.payment_method_name}" was successfully created.`,
          type: "success",
          duration: 5000,
          isClosable: true,
        });

        setFormValues({
          payment_method_name: "",
          is_active: true,
          is_used_to_create_pending_invoice: false,
          is_used_to_deduct_from_package: false,
          is_revenue: true,
        });
      }
    } catch (error) {
      toaster.create({
        title: "Error",
        description: error.response?.data?.message || "Failed to create payment method. Please try again.",
        type: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="w-full max-w-2xl bg-gray-100 rounded-lg p-8">
          <h1 className="text-2xl font-bold text-black mb-2">Create a Payment Method</h1>
          <p className="text-gray-600 mb-6">Enter the details for the new payment method.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <Field label="Payment Method Name">
                <input
                  type="text"
                  name="payment_method_name"
                  value={formValues.payment_method_name}
                  onChange={handleInputChange}
                  className="w-full bg-white text-black rounded-md p-2 border border-gray-300"
                  required
                />
                {errors.payment_method_name && (
                  <p className="text-red-500 text-sm">{errors.payment_method_name}</p>
                )}
              </Field>

              <Field label="Is Active">
                <Switch 
                  checked={formValues.is_active}
                  onCheckedChange={() => handleSwitchChange("is_active")}
                />
              </Field>
              
              <Field label="Used to Create Pending Invoice">
                <Switch 
                  checked={formValues.is_used_to_create_pending_invoice}
                  onCheckedChange={() => handleSwitchChange("is_used_to_create_pending_invoice")}
                />
              </Field>
              
              <Field label="Used to Deduct from Package">
                <Switch 
                  checked={formValues.is_used_to_deduct_from_package}
                  onCheckedChange={() => handleSwitchChange("is_used_to_deduct_from_package")}
                />
              </Field>
              
              <Field label="Revenue">
                <Switch 
                  checked={formValues.is_revenue}
                  onCheckedChange={() => handleSwitchChange("is_revenue")}
                />
              </Field>
            </div>
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-md"
              disabled={isSubmitting || !formValues.payment_method_name.trim()}
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePaymentMethod;
