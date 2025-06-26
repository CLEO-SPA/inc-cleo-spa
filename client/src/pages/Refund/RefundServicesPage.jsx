import React, { useEffect } from 'react';
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
    const { memberId } = useParams();
    const navigate = useNavigate()

    const {
        serviceTransactions,
        isLoading,
        error,
        fetchServiceTransactions,
        clear,
    } = useRefundStore();

    useEffect(() => {
        if (memberId) {
            fetchServiceTransactions(Number(memberId));
        }

        return () => clear();
    }, [memberId, fetchServiceTransactions, clear]);

    const handleRefundService = (transactionId, serviceId, serviceName, amount) => {
        // TODO: Implement refund logic
        console.log("Refunding:", { transactionId, serviceId, serviceName, amount })
        // You can add confirmation dialog here
        if (window.confirm(`Are you sure you want to refund "${serviceName}" for $${amount}?`)) {
            // Call refund API
        }
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    return (
        <div className="[--header-height:calc(theme(spacing.14))]">
            <SidebarProvider className="flex flex-col">
                <SiteHeader />
                <div className="flex flex-1">
                    <AppSidebar />
                    <SidebarInset>
                        <div className="p-6 max-w-5xl mx-auto w-full">
                            {/* Back Button */}
                            <div className="mb-6">
                                <Button variant="outline" onClick={() => navigate(-1)} className="flex items-center gap-2">
                                    <ArrowLeft className="h-4 w-4" />
                                    Back
                                </Button>
                            </div>

                            {/* Page Header */}
                            <div className="mb-8">
                                <h1 className="text-2xl font-bold text-gray-900 mb-2">Service Refunds</h1>
                                {serviceTransactions.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-gray-900">
                                            <User className="h-4 w-4" />
                                            <span className="font-medium text-lg">{serviceTransactions[0].member_name}</span>
                                        </div>
                                        <div className="flex flex-col gap-1 text-sm text-gray-600 ml-6">
                                            <div>📧 {serviceTransactions[0].member_email}</div>
                                            <div>📞 {serviceTransactions[0].member_contact}</div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Loading State */}
                            {isLoading && (
                                <Card>
                                    <CardContent className="p-8 text-center">
                                        <div className="text-gray-600">Loading service transactions...</div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Error State */}
                            {error && (
                                <Card className="border-red-200 bg-red-50">
                                    <CardContent className="p-6">
                                        <div className="text-red-700 font-medium">Error loading transactions</div>
                                        <div className="text-red-600 text-sm mt-1">{error}</div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* No Transactions */}
                            {!isLoading && !error && serviceTransactions.length === 0 && (
                                <Card>
                                    <CardContent className="p-8 text-center">
                                        <div className="text-gray-600">No service transactions found for this member.</div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Transactions List */}
                            {!isLoading && !error && serviceTransactions.length > 0 && (
                                <div className="space-y-6">
                                    {serviceTransactions.map((transaction) => (
                                        <Card key={transaction.sale_transaction_id} className="shadow-sm">
                                            <CardHeader className="pb-4">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <CardTitle className="text-lg font-semibold text-gray-900">
                                                            Transaction #{transaction.sale_transaction_id}
                                                        </CardTitle>
                                                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                                            <div className="flex items-center gap-1">
                                                                <Receipt className="h-4 w-4" />
                                                                <span>Receipt: {transaction.receipt_no || "No receipt"}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Calendar className="h-4 w-4" />
                                                                <span>{formatDate(transaction.created_at)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="flex items-center gap-1 text-lg font-bold text-green-600">
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
                                                    {transaction.items.map((item) => (
                                                        <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                                            <div className="flex-1">
                                                                <div className="font-medium text-gray-900">{item.service_name}</div>
                                                                <div className="text-sm text-gray-600 mt-1">
                                                                    Quantity: {item.quantity} x ${item.amount} each
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <Badge variant="secondary" className="text-sm">
                                                                    ${(Number.parseFloat(item.amount) * item.quantity).toFixed(2)}
                                                                </Badge>
                                                                <Button
                                                                    variant="destructive"
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        handleRefundService(
                                                                            transaction.sale_transaction_id,
                                                                            item.id,
                                                                            item.service_name,
                                                                            (Number.parseFloat(item.amount) * item.quantity).toFixed(2),
                                                                        )
                                                                    }
                                                                    className="bg-red-600 hover:bg-red-700"
                                                                >
                                                                    Refund
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    </SidebarInset>
                </div>
            </SidebarProvider>
        </div>
    )
}

export default RefundServicesPage
