import React, { useState, useEffect } from 'react';
import { LuCalendar } from 'react-icons/lu';
import Navbar from '@/components/Navbar';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, parseISO } from 'date-fns';
import { api } from '../../interceptors/axios'; // assuming your axios instance is here

const API_URL = import.meta.env.VITE_API_URL;

const RecordMembershipAccount = () => {
    const [memberName, setMemberName] = useState('');
    const [members, setMembers] = useState([]);
    const [membershipAccounts, setMembershipAccounts] = useState([]);
    const [membershipHistory, setMembershipHistory] = useState([]); // state for membership history
    const [storedValueAccounts, setStoredValueAccounts] = useState([]); // state for stored value accounts
    const [storedValueAccountTransactionLogs, setStoredValueAccountTransactionLogs] = useState([]); // state for transaction logs
    const [selectedMemberId, setSelectedMemberId] = useState(null);
    const [selectedStoredValueAccountId, setSelectedStoredValueAccountId] = useState(null); // store selected stored value account ID
    const [isSearchClicked, setIsSearchClicked] = useState(false); // state to track if the search button is clicked
    const [invoices, setInvoices] = useState([]); // state for invoices
    const [invoiceItems, setInvoiceItems] = useState([]); // state for invoice items
    const [servingEmployeeToInvoice, setServingEmployeeToInvoice] = useState([]); // state for serving employee to invoice
    const [paymentToInvoice, setPaymentToInvoice] = useState([]);




    // Fetch members using api.get with relative URL
    const fetchMembers = async () => {
        if (!memberName) return; // Do nothing if name is empty
        setIsSearchClicked(true); // Set state to true when search is clicked
        try {
            const response = await api.get(`/m/mName?name=${memberName}`); // changed to relative path
            const membersArray = Object.values(response.data);
            setMembers(membersArray); // Update the state with the array
        } catch (error) {
            console.error('Error fetching members:', error);
            setMembers([]); // Fallback to an empty array on error
        }
    };

    // Fetch membership accounts using api.get with relative URL
    const fetchMembershipAccounts = async (memberId) => {
        try {
            const response = await api.get(`/mt/ma/${memberId}`);
            const accounts = Array.isArray(response.data) ? response.data : [response.data];
            setMembershipAccounts(accounts); // Set the accounts as an array
        } catch (error) {
            console.error('Error fetching membership accounts:', error);
        }
    };

    // Fetch membership history using api.get with relative URL
    const fetchMembershipHistory = async (memberId) => {
        try {
            const response = await api.get(`/mt/h/${memberId}`);
            const history = Array.isArray(response.data) ? response.data : [response.data];
            setMembershipHistory(history); // Set the history as an array
        } catch (error) {
            console.error('Error fetching membership history:', error);
        }
    };

    // Fetch stored value accounts using api.get with relative URL
    const fetchStoredValueAccounts = async (memberId) => {
        try {
            const response = await api.get(`/sva/${memberId}`);
            const storedValueData = Array.isArray(response.data) ? response.data : [response.data];
            setStoredValueAccounts(storedValueData); // Set the stored value accounts
        } catch (error) {
            console.error('Error fetching stored value accounts:', error);
        }
    };

    // Fetch stored value account transaction logs using api.get with relative URL
    const fetchStoredValueAccountTransactionLogs = async (accountId) => {
        try {
            const response = await api.get(`/sva/ta/${accountId}`);
            const transactionLogs = Array.isArray(response.data) ? response.data : [response.data];
            setStoredValueAccountTransactionLogs(transactionLogs); // Set the transaction logs
        } catch (error) {
            console.error('Error fetching transaction logs:', error);
        }
    };
    const fetchInvoiceItems = async (invoiceId) => {
        try {
            const response = await api.get(`/ci/it/${invoiceId}`);
            const itemsData = Array.isArray(response.data) ? response.data : [response.data];
            setInvoiceItems(itemsData); // Set the invoice items data
            return itemsData; // ✅ Return the fetched data
        } catch (error) {
            console.error('Error fetching invoice items:', error);
            return []; // ✅ Return an empty array to prevent errors
        }
    };

    const fetchServingEmployeeToInvoice = async (invoiceItemId) => {
        console.log(invoiceItemId)
        try {
            const response = await api.get(`/em/se/${invoiceItemId}`);

            console.log(response.data);
            const employeeToInvoiceData = Array.isArray(response.data) ? response.data : [response.data];
            setServingEmployeeToInvoice(employeeToInvoiceData); // Set the serving employee to invoice data
        } catch (error) {
            console.error('Error fetching serving employee to invoice:', error);
        }
    };
    const fetchPaymentToInvoice = async (invoiceId) => {
        try {
            const response = await api.get(`/ci/p/${invoiceId}`);

            // Ensure the data is an array
            const paymentData = Array.isArray(response.data) ? response.data : [response.data];

            setPaymentToInvoice(paymentData);
        } catch (error) {
            console.error("Error fetching payment to invoice data:", error);
        }
    };
    const handleMemberClick = (memberId) => {
        setSelectedMemberId(memberId);
        fetchMembershipAccounts(memberId); // fetch membership accounts using memberId
        fetchMembershipHistory(memberId); // fetch membership history using memberId
        fetchStoredValueAccounts(memberId); // fetch stored value accounts using memberId
        fetchInvoices(memberId); // fetch invoices using memberId

    };
    const handleInvoiceClick = async (invoiceId) => {
        const items = await fetchInvoiceItems(invoiceId); // Fetch invoice items first

        items.forEach((item) => fetchServingEmployeeToInvoice(Number(item.invoice_item_id))); // Ensure it's a number

        fetchPaymentToInvoice(invoiceId); // Fetch payment details
    };



    const handleStoredValueAccountClick = (accountId) => {
        setSelectedStoredValueAccountId(accountId); // Store the selected stored value account ID
        fetchStoredValueAccountTransactionLogs(accountId); // fetch transaction logs using stored value account ID
    };

    const fetchInvoices = async (memberId) => {
        try {
            const response = await api.get(`/ci/m/${memberId}`);
            const invoiceData = Array.isArray(response.data) ? response.data : [response.data];
            setInvoices(invoiceData); // Set the invoices data
        } catch (error) {
            console.error('Error fetching invoices:', error);
        }
    };
    return (
        <div className="min-h-screen bg-gray-900 text-gray-100">
            <Navbar />
            <main className="container mx-auto px-4 py-12">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-white">Inspect All Records</h1>
                    <p className="text-xl text-gray-400 mt-2">
                        View details for each member and their membership accounts
                    </p>
                </div>

                {/* Search and Date Picker */}
                <div className="bg-gray-800 p-8 rounded-3xl shadow-xl border border-gray-700 flex flex-col items-center mb-8">
                    <label className="text-lg font-medium text-white mb-4">Search Member by Name</label>
                    <input
                        type="text"
                        value={memberName}
                        onChange={(e) => setMemberName(e.target.value)}
                        placeholder="Enter member name"
                        className="mb-4 p-4 rounded-lg bg-gray-700 text-white focus:outline-none shadow-md w-full max-w-xs"
                    />
                    <button
                        onClick={fetchMembers}
                        className="bg-blue-600 px-8 py-3 rounded-lg text-white hover:bg-blue-700 transition duration-300 focus:outline-none w-full max-w-xs"
                    >
                        Search Member
                    </button>
                </div>

                {/* Members Table - Display only after search */}
                {isSearchClicked && members.length > 0 && (
                    <div className="mb-8">
                        <h3 className="text-2xl font-bold text-white mb-4">Members List</h3>
                        <div className="bg-gray-800 shadow-lg rounded-2xl overflow-hidden">
                            <table className="min-w-full table-auto text-white">
                                <thead>
                                    <tr className="bg-gray-700 hover:bg-gray-600 transition duration-300">
                                        <th className="px-6 py-4 text-left">Member ID</th>
                                        <th className="px-6 py-4 text-left">Member Name</th>
                                        <th className="px-6 py-4 text-left">Email</th>
                                        <th className="px-6 py-4 text-left">Contact</th>
                                        <th className="px-6 py-4 text-left">Gender</th>
                                        <th className="px-6 py-4 text-left">DOB</th>
                                        <th className="px-6 py-4 text-left">Remarks</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(members || []).map((member) => (
                                        <tr
                                            key={member.member_id}
                                            onClick={() => handleMemberClick(member.member_id)}
                                            className="cursor-pointer hover:bg-gray-600 transition duration-300"
                                        >
                                            <td className="px-6 py-4">{member.member_id}</td>
                                            <td className="px-6 py-4">{member.member_name}</td>
                                            <td className="px-6 py-4">{member.member_email}</td>
                                            <td className="px-6 py-4">{member.member_contact}</td>
                                            <td className="px-6 py-4">{member.member_sex}</td>
                                            <td className="px-6 py-4">{member.member_dob}</td>
                                            <td className="px-6 py-4">{member.remarks}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Membership Accounts Table (Display only after member is selected) */}
                {selectedMemberId && membershipAccounts.length > 0 && (
                    <div>
                        <h3 className="text-2xl font-bold text-white mb-4">Membership Accounts</h3>
                        <div className="bg-gray-800 shadow-lg rounded-2xl overflow-hidden">
                            <table className="min-w-full table-auto text-white">
                                <thead>
                                    <tr className="bg-gray-700 hover:bg-gray-600 transition duration-300">
                                        <th className="px-6 py-4 text-left">Membership ID</th>
                                        <th className="px-6 py-4 text-left">Start Date</th>
                                        <th className="px-6 py-4 text-left">End Date</th>
                                        <th className="px-6 py-4 text-left">Created At</th>
                                        <th className="px-6 py-4 text-left">Updated At</th>
                                        <th className="px-6 py-4 text-left">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {membershipAccounts.map((account) => (
                                        <tr key={account.membership_accounts_id}>
                                            <td className="px-6 py-4">{account.membership_accounts_id}</td>
                                            <td className="px-6 py-4">{format(parseISO(account.start_date), 'dd/MM/yyyy')}</td>
                                            <td className="px-6 py-4">
                                                {account.end_date ? format(parseISO(account.end_date), 'dd/MM/yyyy') : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4">
                                                {account.membership_accounts_created_at
                                                    ? format(parseISO(account.membership_accounts_created_at), 'dd/MM/yyyy HH:mm:ss')
                                                    : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4">
                                                {account.membership_accounts_updated_at
                                                    ? format(parseISO(account.membership_accounts_updated_at), 'dd/MM/yyyy HH:mm:ss')
                                                    : 'N/A'}
                                            </td>

                                            <td className="px-6 py-4">
                                                {account.is_active ? 'Active' : 'Inactive'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Stored Value Accounts Table (Display only after member is selected) */}
                {selectedMemberId && storedValueAccounts.length > 0 && (
                    <div className="mt-8">
                        <h3 className="text-2xl font-bold text-white mb-4">Stored Value Accounts</h3>
                        <div className="bg-gray-800 shadow-lg rounded-2xl overflow-hidden">
                            <table className="min-w-full table-auto text-white">
                                <thead>
                                    <tr className="bg-gray-700 hover:bg-gray-600 transition duration-300">
                                        <th className="px-6 py-4 text-left">Stored Value Account ID</th>
                                        <th className="px-6 py-4 text-left">Balance</th>
                                        <th className="px-6 py-4 text-left">Created At</th>
                                        <th className="px-6 py-4 text-left">Updated At</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {storedValueAccounts.map((account) => (
                                        <tr
                                            key={account.stored_value_accounts_id}
                                            onClick={() => handleStoredValueAccountClick(account.stored_value_accounts_id)}
                                            className="cursor-pointer hover:bg-gray-600 transition duration-300"
                                        >
                                            <td className="px-6 py-4">{account.stored_value_accounts_id}</td>
                                            <td className="px-6 py-4">{account.stored_value_accounts_balance}</td>
                                            <td className="px-6 py-4">
                                                {account.stored_value_accounts_created_at
                                                    ? format(parseISO(account.stored_value_accounts_created_at), 'dd/MM/yyyy HH:mm:ss')
                                                    : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4">
                                                {account.stored_value_accounts_updated_at
                                                    ? format(parseISO(account.stored_value_accounts_updated_at), 'dd/MM/yyyy HH:mm:ss')
                                                    : 'N/A'}
                                            </td>

                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Stored Value Account Transaction Logs Table (Display only after stored value account is selected) */}
                {selectedStoredValueAccountId && storedValueAccountTransactionLogs.length > 0 && (
                    <div className="mt-8">
                        <h3 className="text-2xl font-bold text-white mb-4">Transaction Logs</h3>
                        <div className="bg-gray-800 shadow-lg rounded-2xl overflow-hidden">
                            <table className="min-w-full table-auto text-white">
                                <thead>
                                    <tr className="bg-gray-700 hover:bg-gray-600 transition duration-300">
                                        <th className="px-6 py-4 text-left">Transaction Type</th>
                                        <th className="px-6 py-4 text-left">Balance Change Amount</th>
                                        <th className="px-6 py-4 text-left">Remarks</th>
                                        <th className="px-6 py-4 text-left">Balance After</th>
                                        <th className="px-6 py-4 text-left">Created At</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {storedValueAccountTransactionLogs.map((log, index) => (
                                        <tr key={log.id || `${log.stored_value_account_id}-${index}`}>
                                            <td className="px-6 py-4">{log.transaction_type}</td>
                                            <td className="px-6 py-4">{log.balance_change_amount}</td>
                                            <td className="px-6 py-4">{log.remarks}</td>
                                            <td className="px-6 py-4">{log.balance_after}</td>
                                            <td className="px-6 py-4">
                                                {log.stored_value_transactions_logs_created_at
                                                    ? format(parseISO(log.stored_value_transactions_logs_created_at), 'dd/MM/yyyy HH:mm:ss')
                                                    : 'N/A'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>

                            </table>
                        </div>
                    </div>
                )}

                {selectedMemberId && invoices.length > 0 && (
                    <div className="mt-8">
                        <h3 className="text-2xl font-bold text-white mb-4">Invoices</h3>
                        <div className="bg-gray-800 shadow-lg rounded-2xl overflow-hidden">
                            <table className="min-w-full table-auto text-white">
                                <thead>
                                    <tr className="bg-gray-700 hover:bg-gray-600 transition duration-300">
                                        <th className="px-6 py-4 text-left">Invoice ID</th>
                                        <th className="px-6 py-4 text-left">Manual Invoice No.</th>
                                        <th className="px-6 py-4 text-left">Total Amount</th>
                                        <th className="px-6 py-4 text-left">Total Paid Amount</th>
                                        <th className="px-6 py-4 text-left">Outstanding Amount</th>
                                        <th className="px-6 py-4 text-left">Status</th>
                                        <th className="px-6 py-4 text-left">Created At</th>
                                        <th className="px-6 py-4 text-left">Updated At</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoices.map((invoice) => (
                                        <tr
                                            key={invoice.invoice_id}
                                            onClick={() => handleInvoiceClick(invoice.invoice_id)} // Handle invoice click
                                            className="cursor-pointer hover:bg-gray-600 transition duration-300"
                                        >
                                            <td className="px-6 py-4">{invoice.invoice_id}</td>
                                            <td className="px-6 py-4">{invoice.manual_invoice_no}</td>
                                            <td className="px-6 py-4">{invoice.total_invoice_amount}</td>
                                            <td className="px-6 py-4">{invoice.total_paid_amount}</td>
                                            <td className="px-6 py-4">{invoice.outstanding_total_payment_amount}</td>
                                            <td className="px-6 py-4">{invoice.invoice_status}</td>
                                            <td className="px-6 py-4">
                                                {format(parseISO(invoice.invoice_created_at), 'dd/MM/yyyy HH:mm:ss')}
                                            </td>
                                            <td className="px-6 py-4">
                                                {format(parseISO(invoice.invoice_updated_at), 'dd/MM/yyyy HH:mm:ss')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                {/* Invoice Items Table (Display only after invoice is selected) */}
                {invoiceItems.length > 0 && (
                    <div className="mt-8">
                        <h3 className="text-2xl font-bold text-white mb-4">Invoice Items</h3>
                        <div className="bg-gray-800 shadow-lg rounded-2xl overflow-hidden">
                            <table className="min-w-full table-auto text-white">
                                <thead>
                                    <tr className="bg-gray-700 hover:bg-gray-600 transition duration-300">
                                        <th className="px-6 py-4 text-left">Invoice Item ID</th>
                                        <th className="px-6 py-4 text-left">Service Name</th>
                                        <th className="px-6 py-4 text-left">Product Name</th>
                                        <th className="px-6 py-4 text-left">Member Care Package ID</th>
                                        <th className="px-6 py-4 text-left">Original Unit Price</th>
                                        <th className="px-6 py-4 text-left">Custom Unit Price</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoiceItems.map((item) => (
                                        <tr key={item.invoice_item_id} className="hover:bg-gray-600">
                                            <td className="px-6 py-4">{item.invoice_item_id}</td>
                                            <td className="px-6 py-4">{item.service_name}</td>
                                            <td className="px-6 py-4">{item.product_name || "NA "}</td>
                                            <td className="px-6 py-4">{item.member_care_package_id || "NA"}</td>
                                            <td className="px-6 py-4">{item.original_unit_price}</td>
                                            <td className="px-6 py-4">{item.custom_unit_price}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                {servingEmployeeToInvoice.length > 0 && (
                    <div className="mt-8">
                        <h3 className="text-2xl font-bold text-white mb-4">Serving Employee to Invoice</h3>
                        <div className="bg-gray-800 shadow-lg rounded-2xl overflow-hidden">
                            <table className="min-w-full table-auto text-white">
                                <thead>
                                    <tr className="bg-gray-700 hover:bg-gray-600 transition duration-300">
                                        <th className="px-6 py-4 text-left">Employee ID</th>
                                        <th className="px-6 py-4 text-left">Commission Percentage</th>
                                        <th className="px-6 py-4 text-left">Custom Commission Percentage</th>
                                        <th className="px-6 py-4 text-left">Final Calculated Commission Value</th>
                                        <th className="px-6 py-4 text-left">User Remarks</th>
                                        <th className="px-6 py-4 text-left">Created At</th>
                                        <th className="px-6 py-4 text-left">Updated At</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {servingEmployeeToInvoice.map((item) => (
                                        <tr key={item.serving_employee_to_invoice_items_id} className="hover:bg-gray-600">
                                            <td className="px-6 py-4">{item.employee_id}</td>
                                            <td className="px-6 py-4">{item.commission_percentage}</td>
                                            <td className="px-6 py-4">{item.custom_commission_percentage}</td>
                                            <td className="px-6 py-4">{item.final_calculated_commission_value}</td>
                                            <td className="px-6 py-4">{item.user_remarks}</td>
                                            <td className="px-6 py-4">
                                                {item.serving_employee_to_invoice_items_created_at || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4">
                                                {item.serving_employee_to_invoice_items_updated_at || 'N/A'}
                                            </td>

                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {paymentToInvoice.length > 0 && (
                    <div className="mt-8">
                        <h3 className="text-2xl font-bold text-white mb-4">Payment to Invoice</h3>
                        <div className="bg-gray-800 shadow-lg rounded-2xl overflow-hidden">
                            <table className="min-w-full table-auto text-white">
                                <thead>
                                    <tr className="bg-gray-700 hover:bg-gray-600 transition duration-300">
                                        <th className="px-6 py-4 text-left">Payment ID</th>
                                        <th className="px-6 py-4 text-left">Payment Method ID</th>
                                        <th className="px-6 py-4 text-left">Invoice ID</th>
                                        <th className="px-6 py-4 text-left">Amount</th>
                                        <th className="px-6 py-4 text-left">Remarks</th>
                                        <th className="px-6 py-4 text-left">Created By</th>
                                        <th className="px-6 py-4 text-left">Created At</th>
                                        <th className="px-6 py-4 text-left">Updated By</th>
                                        <th className="px-6 py-4 text-left">Updated At</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paymentToInvoice.map((payment) => (
                                        <tr key={payment.invoice_payment_id} className="hover:bg-gray-600">
                                            <td className="px-6 py-4">{payment.invoice_payment_id}</td>
                                            <td className="px-6 py-4">{payment.payment_method_id}</td>
                                            <td className="px-6 py-4">{payment.invoice_id}</td>
                                            <td className="px-6 py-4">{payment.invoice_payment_amount}</td>
                                            <td className="px-6 py-4">{payment.remarks || "N/A"}</td>
                                            <td className="px-6 py-4">{payment.invoice_payment_created_by}</td>
                                            <td className="px-6 py-4">
                                                {payment.invoice_payment_created_at
                                                    ? format(parseISO(payment.invoice_payment_created_at), 'dd/MM/yyyy HH:mm:ss')
                                                    : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4">{payment.invoice_payment_updated_by}</td>
                                            <td className="px-6 py-4">
                                                {payment.invoice_payment_updated_at
                                                    ? format(parseISO(payment.invoice_payment_updated_at), 'dd/MM/yyyy HH:mm:ss')
                                                    : 'N/A'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}


            </main>
        </div>
    );
};

export default RecordMembershipAccount; 