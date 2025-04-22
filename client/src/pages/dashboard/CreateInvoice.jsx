import InvoiceForm from "@/components/createInvoice/InvoiceForm";

function CreateInvoice() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-8xl mx-auto">
        <InvoiceForm />
      </div>
    </div>
  );
}

export default CreateInvoice;
