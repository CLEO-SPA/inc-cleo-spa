import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../interceptors/axios';
import { Button, Text, Textarea } from '@chakra-ui/react';
import Navbar from '@/components/Navbar';
import { LuSave, LuFilePenLine } from 'react-icons/lu';

const EditCreditNote = () => {
  const { cnid } = useParams();
  const navigate = useNavigate();
  const [creditNote, setCreditNote] = useState(null);
  const [remark, setRemark] = useState("");
  const [refundTransactions, setRefundTransactions] = useState([]);
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCreditNoteRecord(cnid);
  }, [cnid]);

  const fetchCreditNoteRecord = async (cnid) => {
    try {
      const response = await api.get(`/r/cn/${cnid}`);
      const formattedCustomer = response.data.customerDetails.member_name === "Guest Account"
        ? { member_name: "Walk-In Customer", member_email: "-", member_contact: "-" }
        : response.data.customerDetails;

      setCreditNote(response.data.serializeCreditNote);
      setRefundTransactions(response.data.serializeRefundTransactions);
      setMember(formattedCustomer);
      setRemark(response.data.serializeCreditNote.remark || "");
    } catch (error) {
      console.error('Failed to fetch credit note details', error);
      setError('Failed to fetch credit note');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (status) => {
    try {
      const updatedCreditNote = { remark };
      console.log('Sending updated credit note:', updatedCreditNote);  // Log request data

      const response = await api.put(`/r/cn/${cnid}/status/${status}`, updatedCreditNote);
      console.log('API Response:', response);  // Log the response

      navigate(`/finance/credit-notes/view/${cnid}`);
    } catch (error) {
      console.error('Failed to update credit note', error);
    }
  };



  if (loading) return <Text>Loading...</Text>;
  if (error) return <Text>{error}</Text>;

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-100">Edit Credit Note</h1>
          <p className="mt-2 text-gray-400">Edit the details of this credit note</p>
        </div>

        <div className="bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-700 space-y-8">
          {/* Credit Note Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-100">Credit Note #{creditNote.credit_note_id}</h3>
            <div className="space-y-2">
              <Text><strong>Amount:</strong> ${creditNote.credit_amount}</Text>
              <Text><strong>Created At:</strong> {new Date(creditNote.created_at).toLocaleDateString()}</Text>
              <Text><strong>Status: <span
                className={`px-2 py-1 rounded-full text-sm font-semibold mr-3 ${creditNote.cs_status.status_name === 'Draft' ? 'bg-orange-900 text-white' :
                  creditNote.cs_status.status_name === 'Confirmed' ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'
                  }`}
              >
                {creditNote.cs_status.status_name}
              </span></strong></Text>
            </div>
          </div>

          {/* Refund Items Table */}
          <div>
            <h4 className="text-lg font-semibold text-gray-100 mb-4">Refund Items</h4>
            <table className="min-w-full bg-gray-700 text-gray-300 border-collapse">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="px-4 py-2 text-left">Service Name</th>
                  <th className="px-4 py-2 text-left">Quantity</th>
                  <th className="px-4 py-2 text-left">Amount</th>
                </tr>
              </thead>
              <tbody>
                {refundTransactions.map((item) => (
                  <tr key={item.member_care_package_transaction_log_id}>
                    <td className="px-4 py-2">{item.service_name}</td>
                    <td className="px-4 py-2">{item.service_name}</td>
                    <td className="px-4 py-2">${item.member_care_package_transaction_logs_amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Remark Section */}
          <div className="mb-4">
            <div className="text-gray-100 mb-2">Remark</div>
            <Textarea
              id="remark"
              value={remark}
              onChange={(e) => setRemark(e.target.value)} // Update the remark state
              placeholder="Enter remarks here..."
              size="sm"
              rows={4}
              required
              className="w-full bg-gray-700 text-gray-300 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4 mt-6">
            <Button
              className="px-6 bg-teal-600 text-white hover:bg-teal-700 rounded-md"
              onClick={() => handleSave('confirmed')}>
              <LuSave className="mr-2" /><strong>Confirm</strong>
            </Button>
            <Button
              className="px-6 bg-yellow-900 text-white hover:bg-yellow-700 rounded-md"
              onClick={() => handleSave('draft')}>
              <LuFilePenLine className="mr-2" /><strong>Save as Draft</strong>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EditCreditNote;