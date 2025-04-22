import { useState } from "react";
import { api } from "@/interceptors/axios";
import { toaster } from "@/components/ui/toaster";
import { Switch } from "@/components/ui/switch";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { DialogHeader, DialogTitle, DialogBody, DialogFooter, DialogCloseTrigger } from "@/components/ui/dialog";

const EditPaymentMethodDialog = ({ method, onUpdate }) => {
  const [formValues, setFormValues] = useState({
    payment_method_name: method.payment_method_name || "",
    is_active: method.is_active,
    is_used_to_create_pending_invoice: method.is_used_to_create_pending_invoice,
    is_used_to_deduct_from_package: method.is_used_to_deduct_from_package,
    is_revenue: method.is_revenue,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFormValid = formValues.payment_method_name.trim() !== "";


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
    setIsSubmitting(true);

    try {
      const response = await api.put(`/pm/${method.payment_method_id}`, formValues);
      if (response.status === 200) {
        toaster.create({
          title: "Payment Method Updated",
          description: `Payment method "${method.payment_method_name}" was successfully updated.`,
          type: "success",
          duration: 5000,
          isClosable: true,
        });
        onUpdate(); // Trigger the update after successful edit
      }
    } catch (error) {
      toaster.create({
        title: "Error",
        description: error.response?.data?.message || "Failed to update payment method. Please try again.",
        type: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <DialogHeader>
        <DialogTitle className="text-xl font-bold">Edit Payment Method</DialogTitle>
        <DialogCloseTrigger />
      </DialogHeader>
      <DialogBody className="space-y-6">
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
      </DialogBody>
      <DialogFooter>
        <Button variant="outline" onClick={() => onUpdate()}>
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-md"
          disabled={isSubmitting || !isFormValid} // Disable if submitting or form is invalid
        >
          {isSubmitting ? "Submitting..." : "Save Changes"}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default EditPaymentMethodDialog;
