import { useEffect, useState } from 'react';
import { api } from '../../interceptors/axios';
import { Button, Text, Input, Box, Stack, Select } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

import Navbar from '@/components/Navbar';
import Pagination from '../../components/Pagination';

const ViewCreditNotesIssued = () => {
  const [creditNotes, setCreditNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [members, setMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [notesPerPage] = useState(9);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCreditNotes();
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/ci/getAllMembers');
      const membersData = response.data.data.map((member) => ({
        id: member.member_id.toString(),
        name: member.member_name,
      }));
      setMembers(membersData);
    } catch (error) {
      console.error('Error fetching members:', error);
      setError('Failed to fetch members.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCreditNotes = async () => {
    try {
      const response = await api.get('/r/cn/all');
      console.log(response.data);
      setCreditNotes(response.data);
      setFilteredNotes(response.data); // Set all notes as filtered initially
    } catch (error) {
      console.error('Failed to fetch credit note details', error);
      setError('Failed to fetch credit notes (获取信用票据失败)');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    if (e.target.value === '') {
      setFilteredNotes(creditNotes); // Reset if empty
    } else {
      const filtered = creditNotes.filter((note) =>
        note.cs_invoices.cs_members?.member_name
          ?.toLowerCase()
          .includes(e.target.value.toLowerCase())
      );
      setFilteredNotes(filtered);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const indexOfLastNote = currentPage * notesPerPage;
  const indexOfFirstNote = indexOfLastNote - notesPerPage;
  const currentNotes = filteredNotes.slice(indexOfFirstNote, indexOfLastNote);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Credit Notes (信用票据)</h1>
          <p className="mt-2 text-gray-900">View and manage credit notes (查看和管理信用票据)</p>
        </div>

        {/* Search Member Input */}
        <div className="mb-6">
          <Input
            placeholder="Search by Member Name (搜索会员名称)"
            value={searchQuery}
            onChange={handleSearch}
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-400"
          />
        </div>

        {/* Credit Notes Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
          {currentNotes.length === 0 ? (
            <div className="col-span-1 flex flex-col items-center justify-center bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
              <Text className="text-xl text-gray-400 text-center" whiteSpace="normal">
                No credit notes available.
              </Text>
              <Text className="text-xl text-gray-400 text-center" whiteSpace="normal">
                暂无信用票据
              </Text>
            </div>

          ) : (
            currentNotes.map((note) => (
              <div
                key={note.refund_id}
                className="col-span-1 bg-gray-200 p-6 rounded-xl shadow-lg border border-gray-700 hover:bg-slate-300 transition-colors"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Credit Note 信用票据 #{note.refund_id}
                </h3>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Manual Invoice Number #{note.cs_invoices.manual_invoice_no}
                </h3>
                <div className="space-y-3 mt-7">
                  <Text>
                    <strong>Amount 金额:</strong> ${note.refund_total_amount}
                  </Text>
                  <Text>
                    <strong>Refund Date 退款日期:</strong>{' '}
                    {note.refund_date ? new Date(note.refund_date).toLocaleDateString() : 'N/A'}
                  </Text>
                  <Text>
                    <strong>Issued By 发票开具者:</strong> {note.cs_employees.employee_name}
                  </Text>
                  <Text>
                    <strong>Employee Code 员工代码:</strong> {note.cs_employees.employee_code}
                  </Text>

                  {/* Member Details Section */}
                  <div className="mt-4 bg-gray-300 p-6 rounded-xl shadow-lg">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 border-b-2 border-black pb-2">
                      Member Details 会员详情
                    </h4>
                    {note.cs_invoices.cs_members && note.cs_invoices.cs_members.member_id !== "1" ? (
                      <>
                        <Text>
                          <strong>Member Name 会员名称:</strong>{' '}
                          {note.cs_invoices.cs_members.member_name}
                        </Text>
                        <Text>
                          <strong>Email 电子邮件:</strong> {note.cs_invoices.cs_members.member_email}
                        </Text>
                        <Text>
                          <strong>Contact 联系电话:</strong>{' '}
                          {note.cs_invoices.cs_members.member_contact}
                        </Text>
                      </>
                    ) : (
                      <Text className="text-gray-900">Walk-in Customer (临时顾客)</Text>
                    )}
                  </div>

                  {/* Remarks Section */}
                  <div className="mt-4 bg-gray-300 p-4 rounded-xl">
                    <h4 className="text-md font-semibold text-gray-900">Remarks 备注:</h4>
                    <Text className="text-black">
                      {note.refund_remarks || 'No remarks available (暂无备注)'}
                    </Text>
                  </div>

                  <div className="flex justify-between">
                    {/* View details Button */}
                    <Button
                      id={`view-button-${note.refund_id}`}
                      colorScheme="teal"
                      onClick={() => navigate(`/finance/credit-notes/view/${note.refund_id}`)}
                      className="w-full py-2 text-white bg-sky-600 hover:bg-teal-600 focus:ring-4 focus:ring-teal-300 rounded-lg transition-colors"
                    >
                      View Details (查看详情)
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination Section */}
        <Pagination
          totalPages={Math.ceil(filteredNotes.length / notesPerPage)}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      </main>
    </div>
  );
};

export default ViewCreditNotesIssued;
