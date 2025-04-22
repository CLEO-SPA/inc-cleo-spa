import InvoiceList from "@/components/retrieveInvoice/InvoiceList";

function InvoiceListPage() {
    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-8xl mx-auto">
                <InvoiceList />
            </div>
        </div>
    );
}

export default InvoiceListPage;