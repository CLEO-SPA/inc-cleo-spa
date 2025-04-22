import { useState, useEffect } from "react";
import { Field } from "@/components/ui/field";
import { api } from "@/interceptors/axios"; 
import FilteredSelect from "@/components/FieldSelector"; 

const PaymentMethodSelect = ({ method, index, updatePaymentMethod }) => {
  const [paymentMethods, setPaymentMethods] = useState([]);

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const response = await api.get("/pm/active"); 
        setPaymentMethods(response.data); 
      } catch (error) {
        console.error("Error fetching payment methods:", error);
      }
    };

    fetchPaymentMethods();
  }, []);

  return (
    <Field label="Payment Method">
      <FilteredSelect 
        options={paymentMethods.map(pm => ({
          id: pm.payment_method_id,
          name: pm.payment_method_name,
        }))}
        value={method.payment_method_id}
        onChange={(selectedId) => updatePaymentMethod(index, "payment_method_id", parseInt(selectedId))}
        getOptionLabel={(option) => option.name}
        placeholder="Select a Payment Method"
        searchPlaceholder="Search Payment Methods..."
        className="w-full"  
      />
    </Field>
  );
};

export default PaymentMethodSelect;
