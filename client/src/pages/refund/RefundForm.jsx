import React, { useState, useEffect, useMemo } from 'react';
import { Field } from '@/components/ui/field';
import { Search } from 'lucide-react';
import { api } from '@/interceptors/axios';
import Navbar from '@/components/Navbar';
import { useNavigate } from 'react-router-dom';

const RefundForm = () => {
    const navigate = useNavigate();
    const [members, setMembers] = useState([]);
    const [filteredMembers, setFilteredMembers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMember, setSelectedMember] = useState(null);
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [sortField, setSortField] = useState('date');
    const [sortDirection, setSortDirection] = useState('desc');
    const [invoiceItems, setInvoiceItems] = useState([]);
    const [showInvoiceItems, setShowInvoiceItems] = useState(false);
    const [refundList, setRefundList] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(7);
    const [isInvoiceSelectedForRefund, setIsInvoiceSelectedForRefund] = useState(false);
    const [initialInvoices, setInitialInvoices] = useState([]);
    const [refundItems, setRefundItems] = useState([]);
    const [carePackages, setCarePackages] = useState([]);

    // Fetch all refund items
    useEffect(() => {
        const fetchRefundItems = async () => {
            try {
                const response = await api.get('/r/');
                setRefundItems(response.data);
            } catch (error) {
                console.error('Error fetching refund items:', error);
            }
        };

        fetchRefundItems();
    }, []);

    const getItemQuantities = (invoiceItemId) => {
        const item = invoiceItems.find((item) => item.id === invoiceItemId);
        const totalQuantity = item?.quantity || 0;
        const unitPrice = item?.originalUnitPrice || 0;

        const refundedQuantity = refundItems
            .filter((refundItem) => refundItem.invoice_item_id === invoiceItemId)
            .reduce((total, refundItem) => total + (refundItem.refund_quantity || 0), 0);

        const remainingQuantity = totalQuantity - refundedQuantity;

        return {
            totalQuantity,
            refundedQuantity,
            remainingQuantity,
            unitPrice,
        };
    };

    // Fetch all members
    useEffect(() => {
        const fetchMembers = async () => {
            try {
                setLoading(true);
                const response = await api.get('/ci/getAllMembers');
                const membersData = response.data.data.map((member) => ({
                    id: member.member_id.toString(),
                    name: member.member_name,
                }));
                console.log("membersData object: ", membersData);
                setMembers(membersData);
            } catch (error) {
                console.error('Error fetching members:', error);
                setError('Failed to fetch members.');
            } finally {
                setLoading(false);
            }
        };
        fetchMembers();
    }, []);

    // Fetch invoices for the selected member
    const fetchInvoices = async (memberId) => {
        try {
            setLoading(true);
            const response = await api.get(`r/ci/list?memberId=${memberId}`);
            setInvoices(response.data.data || []);
            setInitialInvoices(response.data.data || []);
            console.log('Fetched invoices:', response.data.data);
            setError(null);
        } catch (err) {
            setError('Failed to fetch invoices');
            console.error('Error fetching invoices:', err);
        } finally {
            setLoading(false);
        }
    };

    // Handle member search
    const handleSearch = (e) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (query.trim() === '') {
            setFilteredMembers([]);
            return;
        }

        const exactMatch = members.find((member) => member.name.toLowerCase() === query.toLowerCase());

        if (exactMatch) {
            selectMember(exactMatch);
            setFilteredMembers([]);
        } else {
            const results = members.filter((member) =>
                member.name.toLowerCase().includes(query.toLowerCase())
            );
            setFilteredMembers(results);
        }
    };

    // Handle Enter key press
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && filteredMembers.length > 0) {
            selectMember(filteredMembers[0]);
        }
    };

    const selectMember = async (member) => {
        setSelectedMember(member);
        setSearchQuery(member.name);
        setFilteredMembers([]);
        setShowInvoiceItems(false);
        setRefundList([]);
        setIsInvoiceSelectedForRefund(false);
        await fetchInvoices(member.id);
    };

    // Sorting handler
    const handleSort = (field) => {
        setSortDirection((currentDirection) => {
            if (sortField === field) {
                return currentDirection === 'asc' ? 'desc' : 'asc';
            }
            return 'desc';
        });
        setSortField(field);
    };

    const handleView = (invoiceId) => {
        navigate(`/invoices/${invoiceId}`);
    };

    useEffect(() => {
        const fetchCarePackages = async () => {
            try {
                const response = await api.get('/r/get-mcp');
                setCarePackages(response.data);
                console.log("Care Packages:", response.data); // Log the fetched care packages
            } catch (error) {
                console.error('Error fetching care packages:', error);
            }
        };

        fetchCarePackages();
    }, []);

    // Fetch Invoice Items
    const fetchInvoiceItems = async (invoiceId) => {
        try {
            const response = await api.get(`r/ci/list/${invoiceId}`);
            console.log("Invoice items: ", response.data.data.items);
            const items = response.data.data.items || [];
            // Calculate and store the original unit price for each item
            const itemsWithUnitPrice = items.map(item => ({
                ...item,
                originalUnitPrice: item.amount / item.quantity
            }));
            setInvoiceItems(itemsWithUnitPrice);
        } catch (error) {
            console.error("Error fetching invoice items:", error);
            setInvoiceItems([]);
        }
    };

    console.log("Selected Member: ", selectedMember);

    const handleRefund = (invoiceId) => {
        if (isInvoiceSelectedForRefund) {
            setInvoices(initialInvoices);
            setShowInvoiceItems(false);
            setIsInvoiceSelectedForRefund(false);
            setRefundList([]);
        } else {
            const selectedInvoice = invoices.find(invoice => invoice.invoice_id === invoiceId);
            setInvoices(selectedInvoice ? [selectedInvoice] : []);
            setCurrentPage(1);
            fetchInvoiceItems(invoiceId);
            setShowInvoiceItems(true);
            setIsInvoiceSelectedForRefund(true);
        }
    };

    // Refund button click handler for adding to the refund list
    const handleAddToRefundList = (item) => {
        const { remainingQuantity } = getItemQuantities(item.id);

        if (remainingQuantity > 0) {
            // Add the item to the refund list with the remaining quantity and the original remaining quantity
            setRefundList((prevList) => [
                ...prevList,
                {
                    ...item,
                    refundQuantity: remainingQuantity, // Default refund quantity is the remaining quantity
                    originalRemainingQuantity: remainingQuantity, // Store the original remaining quantity
                    remarks: '',
                },
            ]);

            // Update the invoiceItems state to reflect the remaining quantity (set to 0 since it's added to the refund list)
            setInvoiceItems((prevItems) =>
                prevItems.map((invoiceItem) =>
                    invoiceItem.id === item.id
                        ? { ...invoiceItem, quantity: item.quantity - remainingQuantity }
                        : invoiceItem
                )
            );
        }
    };

    const handleRemoveFromRefundList = (item) => {
        // Remove the item from the refund list
        setRefundList((prevList) => prevList.filter((refundItem) => refundItem.id !== item.id));

        // Restore the original remaining quantity to the invoiceItems state
        setInvoiceItems((prevItems) =>
            prevItems.map((invoiceItem) =>
                invoiceItem.id === item.id
                    ? { ...invoiceItem, quantity: invoiceItem.quantity + item.originalRemainingQuantity }
                    : invoiceItem
            )
        );
    };

    const handleQuantityChange = (e, item) => {
        const newQuantity = parseInt(e.target.value, 10) || 1;
        setRefundList((prevList) =>
            prevList.map((i) =>
                i.id === item.id
                    ? { ...i, refundQuantity: newQuantity }
                    : i
            )
        );
    };

    const handleProcessRefund = async () => {
        try {
            if (refundList.length === 0) {
                alert("No items in the refund list.");
                return;
            }

            // Show confirmation dialog
            const isConfirmed = window.confirm("Are you sure you want to process this refund?");
            if (!isConfirmed) {
                return; // Exit if the user cancels
            }

            const refundRemarks = document.querySelector('textarea[placeholder="Enter refund remarks..."]').value;
            const refundDate = document.querySelector('input[type="datetime-local"]').value;

            const refundData = {
                invoice_id: invoices[0]?.invoice_id,
                refund_total_amount: totalRefundAmount,
                refund_remarks: refundRemarks || "None",
                refund_date: refundDate,
            };
            console.log("Refund Data: ", refundData);

            const refundItemsData = refundList.map((item) => ({
                invoice_item_id: item.id,
                refund_quantity: item.refundQuantity,
                refund_item_amount: (item.amount / item.quantity) * item.refundQuantity,
                refund_item_remarks: item.remarks || "None",
            }));
            console.log("Refund Items Data: ", refundItemsData);

            await api.post("r/create-refund", {
                refundData,
                refundItemsData,
            });

            setRefundList([]);
            setShowInvoiceItems(false);
            setIsInvoiceSelectedForRefund(false);
            setInvoices(initialInvoices);

            alert("Refund processed successfully!");
        } catch (error) {
            console.error("Error processing refund:", error);
            alert("Failed to process refund. Please try again.");
        }
    };

    // Filter and sort invoices
    const filteredInvoices = useMemo(() => {
        return invoices
            .filter((invoice) => invoice.member?.id === selectedMember?.id && invoice.invoice_status === 'Invoice_Paid')
            .sort((a, b) => {
                let compareValue = 0;

                switch (sortField) {
                    case 'invoice_id':
                        compareValue = a.invoice_id - b.invoice_id;
                        break;
                    case 'total_amount':
                        compareValue = a.total_invoice_amount - b.total_invoice_amount;
                        break;
                    case 'date':
                        compareValue = new Date(a.invoice_created_at) - new Date(b.invoice_created_at);
                        break;
                    case 'status':
                        compareValue = a.invoice_status.localeCompare(b.invoice_status);
                        break;
                    default:
                        compareValue = 0;
                }

                return sortDirection === 'asc' ? compareValue : -compareValue;
            });
    }, [invoices, selectedMember, sortField, sortDirection]);

    const paginatedInvoices = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredInvoices.slice(startIndex, endIndex);
    }, [filteredInvoices, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const totalRefundAmount = useMemo(() => {
        return refundList.reduce((total, item) => {
            const unitPrice = item.amount / item.quantity;
            const refundQuantity = item.refundQuantity || 1;
            return total + unitPrice * refundQuantity;
        }, 0);
    }, [refundList]);

    const handleItemRemarkChange = (e, item) => {
        const updatedRemarks = e.target.value;
        setRefundList((prevList) =>
            prevList.map((refundItem) =>
                refundItem.id === item.id
                    ? { ...refundItem, remarks: updatedRemarks }
                    : refundItem
            )
        );
    };

    return (
        <div className="bg-gray-100">
            <Navbar />
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
                <div style={{ maxWidth: '80rem' }} className="w-full max-w-4xl bg-white rounded-lg shadow-md p-8 border border-gray-300">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-gray-300 pb-2">Create Refund</h1>

                    {/* Search Member */}
                    <Field>
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={handleSearch}
                                onKeyDown={handleKeyPress}
                                className="w-full bg-white text-gray-800 rounded-md p-2 border border-gray-400"
                                placeholder="Search member by name..."
                                style={{ width: '200%' }}
                            />
                            <Search
                                className="absolute right-3 top-3 text-gray-600"
                                style={{ right: '-11.5rem', top: '0.5rem' }}
                            />
                        </div>
                        {filteredMembers.length > 0 && (
                            <div className="absolute z-50 mt-2 bg-white rounded-md shadow-lg w-full border border-gray-300">
                                {filteredMembers.map((member, index) => (
                                    <button
                                        key={member.id}
                                        onClick={() => selectMember(member)}
                                        className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-200 border-b border-gray-200 last:border-b-0"
                                    >
                                        {member.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </Field>

                    {/* Display Selected Member */}
                    {selectedMember && (
                        <div className="bg-blue-100 p-4 rounded-md mt-4 border border-blue-300">
                            <h2 className="text-gray-900 text-lg font-semibold">Selected Member</h2>
                            <p className="text-gray-800">Name: {selectedMember.name}</p>
                            <p className="text-gray-800">Member ID: {selectedMember.id}</p>
                        </div>
                    )}

                    {/* Display Invoices for Selected Member */}
                    {selectedMember && filteredInvoices.length > 0 && (
                        <div className="bg-white p-4 rounded-md mt-4 border border-gray-300">
                            <h2 className="text-gray-900 text-lg font-semibold mb-4 border-b border-gray-300 pb-2">
                                {isInvoiceSelectedForRefund
                                    ? "Selected Invoice"
                                    : `Eligible Invoices for ${selectedMember.name}`}
                            </h2>
                            <div className="overflow-x-auto">
                                <table className="w-full divide-y divide-gray-300">
                                    <thead className="bg-gray-200">
                                        <tr>
                                            <th
                                                onClick={() => handleSort('invoice_id')}
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-300"
                                            >
                                                Invoice ID {sortField === 'invoice_id' && (sortDirection === 'asc' ? '↑' : '↓')}
                                            </th>
                                            <th
                                                onClick={() => handleSort('manual_invoice_no')}
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-300"
                                            >
                                                Manual # {sortField === 'manual_invoice_no' && (sortDirection === 'asc' ? '↑' : '↓')}
                                            </th>
                                            <th
                                                onClick={() => handleSort('member_name')}
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-300"
                                            >
                                                Member Name {sortField === 'member_name' && (sortDirection === 'asc' ? '↑' : '↓')}
                                            </th>
                                            <th
                                                onClick={() => handleSort('total_amount')}
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-300"
                                            >
                                                Total Amount {sortField === 'total_amount' && (sortDirection === 'asc' ? '↑' : '↓')}
                                            </th>
                                            <th
                                                onClick={() => handleSort('status')}
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-300"
                                            >
                                                Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                                            </th>
                                            <th
                                                onClick={() => handleSort('date')}
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-300"
                                            >
                                                Date {sortField === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-300">
                                        {paginatedInvoices.map((invoice) => (
                                            <tr key={invoice.invoice_id} className="hover:bg-gray-100">
                                                <td className="px-6 py-4 text-sm text-gray-900">{invoice.invoice_id}</td>
                                                <td className="px-6 py-4 text-sm text-gray-900">{invoice.manual_invoice_no}</td>
                                                <td className="px-6 py-4 text-sm text-gray-900">{invoice.member.name}</td>
                                                <td className="px-6 py-4 text-sm text-gray-900 font-medium">${invoice.total_invoice_amount.toFixed(2)}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                                                    ${invoice.invoice_status === 'Invoice_Paid' ? 'bg-green-100 text-green-800 border border-green-400' :
                                                            invoice.invoice_status === 'Invoice_Unpaid' ? 'bg-red-100 text-red-800 border border-red-400' :
                                                                'bg-yellow-100 text-yellow-800 border border-yellow-400'}`}>
                                                        {invoice.invoice_status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900">{new Date(invoice.invoice_created_at).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 text-sm text-gray-900">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleView(invoice.invoice_id)}
                                                            className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-800 rounded-md text-sm font-medium hover:bg-blue-200 transition-colors border border-blue-300"
                                                        >
                                                            View
                                                        </button>
                                                        <button
                                                            data-testid="refund-button"
                                                            onClick={() => handleRefund(invoice.invoice_id)}
                                                            className="inline-flex items-center px-3 py-1.5 bg-orange-100 text-orange-800 rounded-md text-sm font-medium hover:bg-orange-200 transition-colors border border-orange-300"
                                                        >
                                                            {isInvoiceSelectedForRefund ? "Unselect" : "Refund"}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {filteredInvoices.length > itemsPerPage && (
                                    <div className="flex justify-between items-center mt-4">
                                        <button
                                            onClick={handlePreviousPage}
                                            disabled={currentPage === 1}
                                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md disabled:opacity-50 hover:bg-gray-300 border border-gray-400"
                                        >
                                            Previous
                                        </button>
                                        <div className="flex items-center gap-2">
                                            {Array.from({ length: totalPages }, (_, index) => (
                                                <button
                                                    key={index + 1}
                                                    onClick={() => handlePageChange(index + 1)}
                                                    className={`px-4 py-2 rounded-md ${currentPage === index + 1
                                                        ? 'bg-blue-600 text-white border border-blue-700'
                                                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300 border border-gray-400'
                                                        }`}
                                                >
                                                    {index + 1}
                                                </button>
                                            ))}
                                        </div>
                                        <button
                                            onClick={handleNextPage}
                                            disabled={currentPage === totalPages}
                                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md disabled:opacity-50 hover:bg-gray-300 border border-gray-400"
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Display Invoice Items for Refund */}
                    {showInvoiceItems && invoiceItems && (
                        <div className="bg-white p-4 rounded-md mt-4 border border-gray-300">
                            <h2 className="text-gray-900 text-lg font-semibold mb-4 border-b border-gray-300 pb-2">Invoice Items</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full divide-y divide-gray-300">
                                    <thead className="bg-gray-200">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                Item ID
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                Service/Product Name
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                Care Package Name
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                Amount
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                Quantity
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-300">
                                        {invoiceItems && invoiceItems.length > 0 ? (
                                            invoiceItems.flatMap((item) => {
                                                const { remainingQuantity, refundedQuantity, unitPrice } = getItemQuantities(item.id);

                                                // Handle null member_care_package_id
                                                const carePackageName = item.member_care_package_id
                                                    ? carePackages.find(pkg => pkg.member_care_package_id === item.member_care_package_id)?.care_package_name || 'N/A'
                                                    : 'N/A';

                                                const entries = [];

                                                if (remainingQuantity > 0) {
                                                    const remainingAmount = unitPrice * remainingQuantity;
                                                    entries.push(
                                                        <tr key={`${item.id}-remaining`} className="hover:bg-gray-100">
                                                            <td className="px-6 py-4 text-sm text-gray-900">{item.id}</td>
                                                            <td className="px-6 py-4 text-sm text-gray-900">{item.product_name || item.service_name}</td>
                                                            <td className="px-6 py-4 text-sm text-gray-900">{carePackageName}</td>
                                                            <td className="px-6 py-4 text-sm text-gray-900 font-medium">${remainingAmount.toFixed(2)}</td>
                                                            <td className="px-6 py-4 text-sm text-gray-900">{remainingQuantity}x</td>
                                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                                <button
                                                                    onClick={() => handleAddToRefundList(item)}
                                                                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded border border-green-700"
                                                                >
                                                                    Add to Refund List
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                }

                                                if (refundedQuantity > 0) {
                                                    const refundedAmount = unitPrice * refundedQuantity;
                                                    entries.push(
                                                        <tr key={`${item.id}-refunded`} className="bg-gray-100">
                                                            <td className="px-6 py-4 text-sm text-gray-900">{item.id}</td>
                                                            <td className="px-6 py-4 text-sm text-gray-900">{item.product_name || item.service_name}</td>
                                                            <td className="px-6 py-4 text-sm text-gray-900">{carePackageName}</td>
                                                            <td className="px-6 py-4 text-sm text-gray-900 font-medium">${refundedAmount.toFixed(2)}</td>
                                                            <td className="px-6 py-4 text-sm text-gray-900">{refundedQuantity}x</td>
                                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-400">
                                                                    Refunded
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                }

                                                return entries;
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan="6" className="px-6 py-4 text-sm text-gray-700 text-center">
                                                    No items found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Display Refund List */}
                    {refundList.length > 0 && (
                        <div className="bg-white p-4 rounded-md mt-4 border border-gray-300">
                            <h2 className="text-gray-900 text-lg font-semibold mb-4 border-b border-gray-300 pb-2">Refund List</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full divide-y divide-gray-300">
                                    <thead className="bg-gray-200">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                Item ID
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                Service/Product Name
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                Amount
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                Quantity
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                                Item Remark
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-300">
                                        {refundList.map((item, index) => {
                                            const unitPrice = item.amount / item.quantity;
                                            const refundQuantity = item.refundQuantity || 1;
                                            const calculatedAmount = unitPrice * refundQuantity;


                                            return (
                                                <tr key={index} className="hover:bg-gray-100">
                                                    <td className="px-6 py-4 text-sm text-gray-900">{item.id}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-900">{item.service_name || item.product_name}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">${calculatedAmount.toFixed(2)}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-900">
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            max={item.originalRemainingQuantity}
                                                            value={refundQuantity}
                                                            onChange={(e) => handleQuantityChange(e, item)}
                                                            className="border border-gray-300 rounded-md p-1 bg-white text-gray-900"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-900">
                                                        <textarea
                                                            placeholder="Enter item remark..."
                                                            value={item.remarks || ''}
                                                            onChange={(e) => handleItemRemarkChange(e, item)}
                                                            style={{ height: '2rem', marginTop: '1.79%' }}
                                                            className="border border-gray-300 rounded-md p-1 w-full bg-white text-gray-900 resize-none"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-900">
                                                        <button
                                                            onClick={() => handleRemoveFromRefundList(item)}
                                                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                                                        >
                                                            Remove
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Refund Date & Time */}
                            <h2 className="text-gray-900 text-lg font-semibold mb-4 mt-4">Refund Date & Time</h2>
                            <input
                                type="datetime-local"
                                defaultValue={new Date(new Date().getTime() + 8 * 60 * 60 * 1000)
                                    .toISOString()
                                    .slice(0, 16)}
                                className="border border-gray-300 rounded-md p-2 bg-gray-100 text-gray-900 w-full mb-4"
                            />

                            {/* Refund Remarks */}
                            <h2 className="text-gray-900 text-lg font-semibold mb-2">Refund Remarks</h2>
                            <textarea
                                placeholder="Enter refund remarks..."
                                className="border border-gray-300 rounded-md p-2 bg-gray-100 text-gray-900 w-full h-24 mb-4 resize-none"
                            />

                            {/* Display Total Refund Amount */}
                            <div className="mt-4 flex justify-end" style={{ marginRight: '3%' }}>
                                <h2 className="text-gray-900 text-lg font-semibold">Total Refund Amount: $</h2>
                                <p className="text-gray-900 text-xl font-bold">{totalRefundAmount.toFixed(2)}</p>
                            </div>

                            {/* Process Refund Button */}
                            <div className="flex justify-center mt-4">
                                <button
                                    onClick={() => handleProcessRefund()}
                                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md font-medium w-36"
                                >
                                    Process Refund
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RefundForm;
