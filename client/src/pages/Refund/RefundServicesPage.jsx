import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, Calendar, Receipt, User, DollarSign } from "lucide-react"
import useRefundStore from '@/stores/useRefundStore';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"


const RefundServicesPage = () => {
    // Get memberId and receiptNo from URL parameters
    const { id: memberId, no: receiptNo } = useParams();
    const navigate = useNavigate()

    const {
        serviceTransactions,
        total,
        isLoading,
        error,
        fetchServiceTransactions,
        clear,
    } = useRefundStore();

    const ITEMS_PER_PAGE = 3;

    const [page, setPage] = useState(1);

    useEffect(() => {
        //console.log('useEffect triggered with:', { memberId, receiptNo });

        if (memberId) {
            fetchServiceTransactions({
                memberId: Number(memberId),
                limit: ITEMS_PER_PAGE,
                offset: (page - 1) * ITEMS_PER_PAGE,
            });
        } else if (receiptNo) {
            fetchServiceTransactions({
                receiptNo,
                limit: ITEMS_PER_PAGE,
                offset: (page - 1) * ITEMS_PER_PAGE,
            });
        }

        return () => clear();
    }, [memberId, receiptNo, page, fetchServiceTransactions, clear]);

    const handleRefundService = (saleTransactionItemId) => {
        console.log("Refunding:", { saleTransactionItemId });
        navigate(`/refunds/service/${saleTransactionItemId}`);
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    };

    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
    const paginatedTransactions = serviceTransactions;

    return (
        <div className="[--header-height:calc(theme(spacing.14))]">
            <SidebarProvider className="flex flex-col">
                <SiteHeader />
                <div className="flex flex-1">
                    <AppSidebar />
                    <SidebarInset>
                        <div className="bg-white border-b border-gray-200 px-4 py-3">
                            <div className="max-w-5xl mx-auto w-full flex items-center space-x-3">
                                <Button
                                    variant="ghost"
                                    onClick={() => navigate(-1)}
                                    className="flex items-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-2 py-1"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-1" />
                                    Back
                                </Button>
                                <h1 className="text-lg font-semibold text-gray-900">Service Refund</h1>
                            </div>
                        </div>

                        <div className="p-6 max-w-5xl mx-auto w-full">
                            {serviceTransactions.length > 0 && (
                                <div className="mb-6 space-y-2">
                                    <div className="flex items-center gap-2 text-gray-900">
                                        <User className="h-4 w-4" />
                                        <span className="font-medium text-lg">
                                            {serviceTransactions[0].member_name || 'Unknown Customer'}
                                        </span>
                                    </div>
                                    {(serviceTransactions[0].member_email || serviceTransactions[0].member_contact) && (
                                        <div className="flex flex-col gap-1 text-sm text-gray-600 ml-6">
                                            {serviceTransactions[0].member_email && <div>Email: {serviceTransactions[0].member_email}</div>}
                                            {serviceTransactions[0].member_contact && <div>Contact: {serviceTransactions[0].member_contact}</div>}
                                        </div>
                                    )}
                                </div>
                            )}

                            {isLoading && (
                                <Card>
                                    <CardContent className="p-8 text-center text-gray-600">
                                        Loading service transactions...
                                    </CardContent>
                                </Card>
                            )}

                            {error && (
                                <Card className="border-red-200 bg-red-50">
                                    <CardContent className="p-6">
                                        <div className="text-red-700 font-medium">Error loading transactions</div>
                                        <div className="text-red-600 text-sm mt-1">{error}</div>
                                    </CardContent>
                                </Card>
                            )}

                            {!isLoading && !error && serviceTransactions.length === 0 && (
                                <Card>
                                    <CardContent className="p-8 text-center text-gray-600">
                                        {memberId && `No service transactions found for this member.`}
                                        {receiptNo && `No service transactions found for receipt number "${receiptNo}".`}
                                        {!memberId && !receiptNo && `No service transactions found.`}
                                    </CardContent>
                                </Card>
                            )}

                            {!isLoading && !error && serviceTransactions.length > 0 && (
                                <div className="space-y-6">
                                    {paginatedTransactions.map((transaction) => (
                                        <Card key={transaction.sale_transaction_id} className="shadow-sm">
                                            <CardHeader className="pb-4">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <CardTitle className="text-lg font-semibold text-gray-900">
                                                            Transaction #{transaction.sale_transaction_id}
                                                        </CardTitle>
                                                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                                            <div className="flex items-center gap-1">
                                                                <Calendar className="h-4 w-4" />
                                                                <span>{formatDate(transaction.created_at)}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Receipt className="h-4 w-4" />
                                                                <span>Receipt: {transaction.receipt_no || "No receipt"}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="flex items-center gap-1 text-lg font-bold text-gray-900">
                                                            <DollarSign className="h-5 w-5" />
                                                            {transaction.total_paid_amount}
                                                        </div>
                                                        <div className="text-sm text-gray-500">Total Paid</div>
                                                    </div>
                                                </div>
                                            </CardHeader>

                                            <CardContent>
                                                <div className="space-y-3">
                                                    <h4 className="font-medium text-gray-900 mb-3">Services:</h4>
                                                    {transaction.items.map((item) => {
                                                        const unitPrice = item.custom_unit_price ?? item.original_unit_price ?? 0;
                                                        const discountDecimal = parseFloat(item.discount_percentage) ?? 1;
                                                        const discountPercent = ((1 - discountDecimal) * 100).toFixed(0);

                                                        const discountText = item.discount_percentage !== null
                                                            ? `${item.discount_percentage} (${discountPercent}% discount)`
                                                            : "None";

                                                        return (
                                                            <div
                                                                key={item.id}
                                                                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                                                            >
                                                                <div className="flex-1">
                                                                    <div className="font-medium text-gray-900">{item.service_name}</div>
                                                                    <div className="text-sm text-gray-600 mt-1">
                                                                        Quantity: {item.quantity} x ${unitPrice} per unit
                                                                    </div>
                                                                    <div className="text-sm text-gray-500 mt-1">
                                                                        Original Unit Price: ${item.original_unit_price || 'N/A'} |{" "}
                                                                        Custom Unit Price: {item.custom_unit_price ? `$${item.custom_unit_price}` : 'None'} |{" "}
                                                                        Discount: {discountText}
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <Badge variant="secondary" className="text-sm bg-gray-200 text-gray-800">
                                                                        ${(+item.amount).toFixed(2)}
                                                                    </Badge>
                                                                    <Button
                                                                        variant="destructive"
                                                                        size="sm"
                                                                        onClick={() =>
                                                                            handleRefundService(
                                                                                //transaction.sale_transaction_id,
                                                                                item.id, // Sale transaction item ID
                                                                                //item.service_name,
                                                                                //(+item.amount).toFixed(2)
                                                                            )
                                                                        }
                                                                        className="bg-gray-800 hover:bg-black"
                                                                    >
                                                                        Refund
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}

                                    {!receiptNo && totalPages > 1 && (
                                        <div className="flex justify-center items-center gap-4 pt-6">
                                            <Button
                                                disabled={page === 1}
                                                onClick={() => setPage((p) => p - 1)}
                                                variant="outline"
                                                className="px-4 py-2"
                                            >
                                                Previous
                                            </Button>
                                            <span className="text-gray-600 text-sm">
                                                Page {page} of {totalPages}
                                            </span>
                                            <Button
                                                disabled={page === totalPages}
                                                onClick={() => setPage((p) => p + 1)}
                                                variant="outline"
                                                className="px-4 py-2"
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </SidebarInset>
                </div>
            </SidebarProvider>
        </div>
    );
};

export default RefundServicesPage;