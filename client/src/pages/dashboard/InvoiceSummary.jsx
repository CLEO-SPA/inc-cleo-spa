import InvoiceSummary from "@/components/createInvoice/InvoiceSummary";

function InvoicePayment() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-5xl mx-auto">
        <InvoiceSummary />
      </div>
    </div>
  );
}

export default InvoicePayment;