import { useEffect, useState } from 'react';
import { api } from '../../interceptors/axios';
import { Button, Textarea } from '@chakra-ui/react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { LuPencil, LuArrowLeft, LuSave } from 'react-icons/lu'; // Import icons

const ViewCreditNote = () => {
  const { cnid } = useParams(); // Get the credit note ID from the URL
  const [creditNote, setCreditNote] = useState(null);
  const [refundItems, setRefundItems] = useState([]);
  const [member, setMember] = useState(null);
  const [memberCarePackageDetails, setMemberCarePackageDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [remarks, setRemarks] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchCreditNote();
  }, [cnid]);

  // Fetch credit note details
  const fetchCreditNote = async () => {
    try {
      const response = await api.get(`/r/cn/${cnid}`);
      console.log(response.data);

      const formattedCustomer =
        response.data.customerDetails.member_name === 'Guest Account' || response.data.customerDetails.member_id == '1'
          ? { member_name: 'Walk-In Customer', member_email: '-', member_contact: '-' }
          : response.data.customerDetails;

      setCreditNote(response.data.serializedCreditNotes);
      console.log('credit Note: ' + response.data.serializedCreditNotes);
      setRefundItems(response.data.serializedCreditNotes.cs_refund_items || []);
      setMember(formattedCustomer);
      setRemarks(response.data.serializedCreditNotes.refund_remarks || '');

      // Handle member care package details if applicable
      if (response.data.memberCarePackageDetails) {
        setMemberCarePackageDetails(response.data.memberCarePackageDetails);
      }
    } catch (error) {
      console.error('Failed to fetch credit note details', error);
      setError('Failed to fetch credit note');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleSaveRemarks = async () => {
    try {
      await api.put(`/r/cn/${cnid}`, { remarks: remarks });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update remarks', error);
      alert('Failed to update remarks. Please try again.');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen text-gray-700">Loading...</div>;
  if (error) return <div className="text-red-500 text-center p-4">{error}</div>;

  /*
  // Email to customer
  const handleSendEmail = async () => {
    setEmailLoading(true);
    try {
      const response = await api.post(`/r/cn/email/${creditNote.credit_note_id}`);

      // Check if the backend sent a success message
      if (response.status === 200) {
        alert(response.data.message || "Email sent successfully!");
      } else {
        alert("Unexpected response from server.");
      }

    } catch (error) {
      console.error("Failed to send email:", error);
      alert("Failed to send email. Please try again.");
    } finally {
      setEmailLoading(false); // Stop loading
    }
  };
  */

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <Button colorScheme="gray" onClick={() => navigate(-1)}>
            <LuArrowLeft className="mr-2" /> Back
          </Button>
          <div className="flex items-center justify-start space-x-4">
            <h1 className="text-3xl font-bold text-gray-900">Credit Note Details</h1>
            <span className="text-3xl text-gray-600">/</span>
            <span className="text-3xl text-gray-900">信用单详情</span>
          </div>
        </div>

        {creditNote ? (
          <div className="bg-white p-6 rounded-lg shadow-xl space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-5 rounded-lg">
                <h3 className="text-xl font-semibold">Credit Note #{creditNote.refund_id}</h3>
                <p className="text-gray-700">Manual Invoice: #{creditNote.cs_invoices.manual_invoice_no}</p>
                <p className="text-gray-700">Refund Date: {new Date(creditNote.refund_date).toLocaleDateString()}</p>
              </div>
              <div className="bg-gray-50 p-5 rounded-lg">
                <h3 className="text-xl mb-3 font-semibold">Processed By 处理人员</h3>
                <p className="text-gray-700">
                  <span className="font-medium">Name:</span> {creditNote.cs_employees.employee_name}
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">Employee Code:</span> {creditNote.cs_employees.employee_code}
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">Contact:</span> {creditNote.cs_employees.employee_contact}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 p-5 rounded-lg">
              <h3 className="text-xl font-semibold mb-3">Customer Details 客户详情</h3>
              <p className="text-gray-700">
                <span className="font-medium">Name:</span> {member.member_name}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Email:</span> {member.member_email}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Contact:</span> {member.member_contact || 'N/A'}
              </p>
            </div>

            {/* Display Member Care Package Details if available */}
            {memberCarePackageDetails ? (
              <div className="bg-gray-50 p-5 rounded-lg">
                <h3 className="text-xl font-semibold mb-3">Member Care Package Details</h3>
                <p className="text-gray-700">
                  <span className="font-medium">Care Package:</span> {memberCarePackageDetails.care_package_name}
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">Status:</span> {memberCarePackageDetails.cs_status.status_name}
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">Total Amount:</span> $
                  {memberCarePackageDetails.member_care_package_total_amount}
                </p>
              </div>
            ) : (
              <div className="bg-gray-50 p-5 rounded-lg">
                <p className="text-gray-500">No member care package associated with this credit note.</p>
              </div>
            )}

            <div className="bg-gray-100 p-5 rounded-lg">
              <h3 className="text-xl font-semibold">Refunded Items 退款项</h3>
              {refundItems.length > 0 ? (
                <table className="w-full mt-4 border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-slate-300 text-black">
                      <th className="p-3 border">Item Name</th>
                      <th className="p-3 border">Quantity</th>
                      <th className="p-3 border">Amount</th>
                      <th className="p-3 border">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {refundItems.map((item) => (
                      <tr key={item.refund_item_id} className="text-gray-950 border">
                        <td className="p-3 border">
                          {item.cs_invoice_items.service_name || item.cs_invoice_items.product_name || 'N/A'}
                        </td>
                        <td className="p-3 border">{item.refund_quantity}</td>
                        <td className="p-3 border">${item.refund_item_amount}</td>
                        <td className="p-3 border">{item.refund_item_remarks || 'No remarks'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-500">No refund items available.</p>
              )}
            </div>

            <div className="bg-gray-100 p-5 rounded-lg">
              <h4 className="text-lg font-semibold border-b-2 border-gray-300 pb-2 mb-4">Remarks 备注:</h4>
              {isEditing ? (
                <Textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="border border-gray-400 bg-white p-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-sky-700"
                  placeholder="Enter your remarks here 请输入备注 ..."
                />
              ) : (
                <p className="text-gray-700">{remarks || 'No additional remarks provided.'}</p>
              )}
            </div>

            <div className="flex justify-end p-6">
              <div className="text-right">
                <p className="text-xl font-semibold text-gray-800">Total Refund Amount:</p>
                <p className="text-2xl font-bold text-blue-700 mt-2">{`$${creditNote.refund_total_amount}`}</p>
              </div>
            </div>

            {/*
            <div className="flex justify-end gap-4">
              <Button
                onClick={() => navigate(`/finance/edit-credit-note/${creditNote.refund_id}`)}
                colorScheme="teal"
                size="md"       
                className="border-2 bg-teal-500 hover:bg-teal-600 hover:text-white px-4 py-2 rounded-md shadow-md"
              >
                <LuPencil className="mr-2" /> Edit
              </Button>
            </div>
            */}

            <div className="flex justify-end gap-4">
              {isEditing ? (
                <Button
                  onClick={handleSaveRemarks}
                  colorScheme="blue"
                  size="md"
                  className="border-2 bg-yellow-600 hover:bg-yellow-900 hover:text-white px-4 py-2 rounded-md shadow-md"
                >
                  <LuSave className="mr-2" /> Save
                </Button>
              ) : (
                <Button
                  onClick={handleEditClick}
                  colorScheme="teal"
                  size="md"
                  className="border-2 bg-teal-500 hover:bg-teal-600 hover:text-white px-4 py-2 rounded-md shadow-md"
                >
                  <LuPencil className="mr-2" /> Edit
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-gray-500 text-center p-6">No credit note found.</div>
        )}
      </main>
    </div>
  );
};

export default ViewCreditNote;
