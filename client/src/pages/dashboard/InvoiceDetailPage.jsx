// pages/dashboard/InvoiceDetailPage.jsx
import InvoiceDetail from "@/components/retrieveInvoice/InvoiceDetail";

function InvoiceDetailPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Invoice Details</h1>
          <p className="mt-1 text-sm text-gray-600">View detailed invoice information</p>
        </div>
        <InvoiceDetail />
      </div>
    </div>
  );
}

export default InvoiceDetailPage;