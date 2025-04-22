import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LuBanknote } from 'react-icons/lu';
import { Eye, Trash2, X } from 'lucide-react';
import { api } from '@/interceptors/axios';
import {
    DialogBody,
    DialogCloseTrigger,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogRoot,
    DialogTitle,
} from '@/components/ui/dialog';
import Navbar from '@/components/Navbar';
import Pagination from '@/components/Pagination';

// Transaction Type Mappings
const TRANSACTION_TYPE_STYLES = {
    Payment: 'bg-green-500/10 text-green-500',
    Refund: 'bg-red-500/10 text-red-500',
    Adjustment: 'bg-yellow-500/10 text-yellow-500',
};

const TransactionLogsDashboard = () => {
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [transactionToDelete, setTransactionToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const navigate = useNavigate();

    const itemsPerPage = 7;
    const totalPages = Math.ceil(transactions.length / itemsPerPage);
    const currentData = transactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // Fetch transaction logs
    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const response = await api.get('/t');
                if (response.status !== 200) {
                    throw new Error('Failed to fetch transactions');
                }
                setTransactions(response.data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTransactions();
    }, []);

    // Fetch transaction details for modal
    const fetchTransactionDetails = async (id) => {
        try {
            const response = await api.get(`/t/${id}`);
            return response.data;
        } catch (err) {
            console.error('Error fetching transaction details:', err);
            return null;
        }
    };

    const getTransactionTypeStyle = (type) => {
        return TRANSACTION_TYPE_STYLES[type] || 'bg-gray-500/10 text-gray-500';
    };

    // Delete a transaction log
    const handleDelete = async (transactionId) => {
        setTransactionToDelete(transactionId);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        setIsDeleting(true);
        try {
            const response = await api.delete(`/t/${transactionToDelete}`);
            if (response.status !== 200) {
                throw new Error('Failed to delete transaction log');
            }

            // Remove deleted transaction from state
            setTransactions(transactions.filter((tx) => tx.member_care_package_transaction_log_id !== transactionToDelete));
        } catch (err) {
            console.error('Error deleting transaction:', err);
        } finally {
            setIsDeleting(false);
            setIsDeleteDialogOpen(false);
            setTransactionToDelete(null);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white p-8">
                <div className="text-gray-900 text-center">Loading transactions...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-white p-8">
                <div className="text-red-500 text-center p-4 bg-red-500/10 rounded-lg">Error: {error}</div>
            </div>
        );
    }

    return (
        <div>
            <Navbar />
            <div className="min-h-screen bg-white p-8">
                {/* header */}
                <div className="mb-8 flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-900">Transaction Logs</h1>
                    <div className="space-x-4 flex">
                        <Button
                            className="bg-blue-600 hover:bg-blue-700 flex items-center p-3 text-white"
                            onClick={() => navigate('/transactions/create')}
                        >
                            Log New Transaction
                        </Button>
                    </div>
                </div>

                {/* stats grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <Card className="bg-gray-50">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center text-gray-900 gap-4">
                                <div className="p-3 bg-gray-200 rounded-lg">
                                    <LuBanknote className="w-6 h-6" />
                                </div>
                                Total Transactions
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-gray-900">{transactions.length}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* transactions table */}
                <Card className="bg-gray-50">
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-300">
                                        <th className="p-1 text-gray-700 font-bold text-xl text-center">Transaction ID</th>
                                        <th className="p-1 text-gray-700 font-bold text-xl text-center">Transaction Type</th>
                                        <th className="p-1 text-gray-700 font-bold text-xl text-center">Description</th>
                                        <th className="p-1 text-gray-700 font-bold text-xl text-center">Amount</th>
                                        <th className="p-1 text-gray-700 font-bold text-xl text-center">Date</th>
                                        <th className="p-1 text-gray-700 font-bold text-xl text-center">Member Care Package ID</th>
                                        <th className="p-1 text-gray-700 font-bold text-xl text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentData.map((tx) => (
                                        <tr key={tx.member_care_package_transaction_log_id} className="border-b border-gray-300">
                                            <td className="p-4 text-gray-900 text-center">{tx.member_care_package_transaction_log_id}</td>
                                            <td className="p-4 text-gray-900 text-center">
                                                <span className={`px-2 py-1 rounded-full ${getTransactionTypeStyle(tx.member_care_package_transaction_logs_transaction_type)}`}>
                                                    {tx.member_care_package_transaction_logs_transaction_type}
                                                </span>
                                            </td>
                                            <td className="p-4 text-gray-900 text-center">{tx.member_care_package_transaction_logs_description}</td>
                                            <td className="p-4 text-gray-900 text-center">${Number(tx.member_care_package_transaction_logs_amount).toFixed(2)}</td>
                                            <td className="p-4 text-gray-900 text-center">{new Date(tx.member_care_package_transaction_logs_transaction_date).toLocaleDateString()}</td>
                                            <td className="p-4 text-gray-900 text-center">{tx.member_care_package_id}</td>
                                            <td className="p-4 text-center">
                                                <Button
                                                    className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                                    onClick={async () => {
                                                        const details = await fetchTransactionDetails(tx.member_care_package_transaction_log_id);
                                                        setSelectedTransaction(details);
                                                        setIsModalOpen(true);
                                                    }}
                                                >
                                                    <Eye size={16} />
                                                </Button>

                                                <Button
                                                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                    onClick={() => handleDelete(tx.member_care_package_transaction_log_id)}
                                                    disabled={isDeleting}
                                                >
                                                    <Trash2 size={16} />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* delete dialog */}
                <DialogRoot role="alertdialog" open={isDeleteDialogOpen}>
                    <DialogContent className="bg-white">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-semibold text-gray-900">Delete Transaction</DialogTitle>
                        </DialogHeader>

                        <DialogBody className="text-gray-700">
                            <p>Are you sure you want to delete this transaction log? This action cannot be undone.</p>
                        </DialogBody>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={confirmDelete} disabled={isDeleting}>
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </DialogRoot>

                {/* pagination */}
                <Pagination totalPages={totalPages} currentPage={currentPage} onPageChange={setCurrentPage} />
            </div>

            {/* Modal for displaying transaction details */}
            {selectedTransaction && isModalOpen && (
                <DialogRoot role="dialog" open={isModalOpen}>
                    <DialogContent className="bg-white">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-semibold text-gray-900 flex justify-between">
                                Transaction Details
                                <Button
                                    variant="link"
                                    className="text-gray-900"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    <X size={24} />
                                </Button>
                            </DialogTitle>
                        </DialogHeader>

                        <DialogBody className="text-gray-700">
                            <div className="mb-4">
                                <strong>Transaction ID:</strong> {selectedTransaction.member_care_package_transaction_log_id}
                            </div>
                            <div className="mb-4">
                                <strong>Type:</strong> {selectedTransaction.member_care_package_transaction_logs_transaction_type}
                            </div>
                            <div className="mb-4">
                                <strong>Description:</strong> {selectedTransaction.member_care_package_transaction_logs_description}
                            </div>
                            <div className="mb-4">
                                <strong>Amount:</strong> ${Number(selectedTransaction.member_care_package_transaction_logs_amount).toFixed(2)}
                            </div>
                            <div className="mb-4">
                                <strong>Transaction Date:</strong> {new Date(selectedTransaction.member_care_package_transaction_logs_transaction_date).toLocaleString()}
                            </div>
                            <div className="mb-4">
                                <strong>Created At:</strong> {new Date(selectedTransaction.member_care_package_transaction_logs_created_at).toLocaleString()}
                            </div>
                            <div className="mb-4">
                                <strong>Member Care Package Details ID:</strong> {selectedTransaction.member_care_package_details_id}
                            </div>
                            <div className="mb-4">
                                <strong>Employee ID:</strong> {selectedTransaction.employee_id}
                            </div>
                            <div className="mb-4">
                                <strong>Quantity:</strong> {selectedTransaction.member_care_package_transaction_logs_quantity}
                            </div>
                            <div className="mb-4">
                                <strong>Service ID:</strong> {selectedTransaction.service_id ? selectedTransaction.service_id : "N/A"}
                            </div>
                            <div className="mb-4">
                                <strong>Member Care Package ID:</strong> {selectedTransaction.member_care_package_id}
                            </div>
                        </DialogBody>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Close</Button>
                        </DialogFooter>
                    </DialogContent>
                </DialogRoot>
            )}
        </div>
    );
};

export default TransactionLogsDashboard;