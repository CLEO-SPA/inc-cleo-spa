import { useState } from "react";
import AddPaymentForm from "@/components/payment-method/AddPaymentForm";

const PaymentFormExample = () => {
  const [paymentCards, setPaymentCards] = useState([]);
  const totalOrderAmount = 150.75; // Example total amount

  const handleAddPayment = (newPayment) => {
    setPaymentCards(prev => [...prev, newPayment]);
  };

  const handleRemovePayment = (index) => {
    setPaymentCards(prev => prev.filter((_, i) => i !== index));
  };

  const handlePaymentChange = (index, field, value) => {
    setPaymentCards(prev =>
      prev.map((payment, i) =>
        i === index ? { ...payment, [field]: value } : payment
      )
    );
  };

  // Optional: Submit handler
  const handleSubmit = () => {
    const paymentData = {
      payments: paymentCards.map(card => ({
        payment_method_id: card.payment_method_id,
        amount: card.amount,
        remarks: card.remarks,
      })),
      total_amount: totalOrderAmount,
    };
    
    console.log('Payment data to submit:', paymentData);
    // Submit to your API
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Payment Processing</h2>
      
      <AddPaymentForm
        paymentCards={paymentCards}
        onAddPayment={handleAddPayment}
        onRemovePayment={handleRemovePayment}
        onPaymentChange={handlePaymentChange}
        totalAmount={totalOrderAmount}
        showTotalAmount={true}
      />
      
    </div>
  );
};

export default PaymentFormExample;