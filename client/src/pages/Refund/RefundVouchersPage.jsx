import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useRefundStore from "@/stores/useRefundStore";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowLeft, DollarSign, User, FileText } from "lucide-react";

const RefundVoucherPage = () => {
    const { id: memberId } = useParams();
    const navigate = useNavigate();

    const {
        memberVouchers,
        memberInfo,
        fetchMemberVouchersByMemberId,
        isLoading,
        error,
        clear,
    } = useRefundStore();

    useEffect(() => {
        if (memberId) {
            fetchMemberVouchersByMemberId(Number(memberId));
        }
        return () => clear();
    }, [memberId]);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    };

    return (
        <div className="[--header-height:calc(theme(spacing.14))]">
            <SidebarProvider className="flex flex-col">
                <SiteHeader />
                <div className="flex flex-1">
                    <AppSidebar />
                    <SidebarInset>
                        {/* Page Header */}
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
                                <h1 className="text-lg font-semibold text-gray-900">
                                    Member Voucher Refund
                                </h1>
                            </div>
                        </div>

                        <div className="p-6 max-w-5xl mx-auto w-full">
                            {/* Member Info */}
                            {memberInfo && (
                                <div className="mb-6 space-y-2">
                                    <div className="flex items-center gap-2 text-gray-900">
                                        <User className="h-4 w-4" />
                                        <span className="font-medium text-lg">
                                            {memberInfo.name || "Unknown Customer"}
                                        </span>
                                    </div>
                                    {(memberInfo.email || memberInfo.contact) && (
                                        <div className="flex flex-col gap-1 text-sm text-gray-600 ml-6">
                                            {memberInfo.email && <div>Email: {memberInfo.email}</div>}
                                            {memberInfo.contact && <div>Contact: {memberInfo.contact}</div>}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Loading State */}
                            {isLoading && (
                                <Card>
                                    <CardContent className="p-8 text-center text-gray-600">
                                        Loading vouchers...
                                    </CardContent>
                                </Card>
                            )}

                            {/* Error State */}
                            {error && (
                                <Card className="border-red-200 bg-red-50">
                                    <CardContent className="p-6">
                                        <div className="text-red-700 font-medium">
                                            Error loading vouchers
                                        </div>
                                        <div className="text-red-600 text-sm mt-1">{error}</div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* No Vouchers */}
                            {!isLoading && !error && memberVouchers.length === 0 && (
                                <Card>
                                    <CardContent className="p-8 text-center text-gray-600">
                                        No refundable member vouchers found for this member.
                                    </CardContent>
                                </Card>
                            )}

                            {/* Voucher Cards */}
                            {!isLoading && !error && memberVouchers.length > 0 && (
                                <div className="space-y-6">
                                    {memberVouchers.map((voucher) => (
                                        <Card key={voucher.id} className="shadow-sm">
                                            <CardHeader className="pb-2 border-b">
                                                <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                                    {voucher.member_vouchers_name}
                                                    <span className="text-sm text-gray-500">({`ID: ${voucher.id}`})</span>
                                                </CardTitle>
                                            </CardHeader>

                                            <CardContent className="pt-4 text-sm text-gray-700 space-y-1">
                                                <div className="grid grid-cols-2 gap-y-1">
                                                    <span>Created At:</span>
                                                    <span>{formatDate(voucher.created_at)}</span>

                                                    <span>Current Balance:</span>
                                                    <span>${voucher.current_balance}</span>

                                                    <span>Free Of Charge (FOC):</span>
                                                    <span>${voucher.free_of_charge}</span>

                                                    <span>Default Price:</span>
                                                    <span>${voucher.default_total_price}</span>

                                                    <span>Refundable Amount:</span>
                                                    <span className="font-semibold text-green-600">
                                                        ${Number(voucher.refundable_amount).toFixed(2)}
                                                    </span>
                                                </div>

                                                <div className="pt-4 flex flex-wrap gap-2">
                                                    <Button
                                                        className="bg-gray-800 hover:bg-black text-white"
                                                        onClick={() =>
                                                            navigate(`/refunds/voucher/${voucher.id}`)
                                                        }
                                                    >
                                                        Refund Voucher
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() =>
                                                            navigate(`/mv/${voucher.id}/consume`)
                                                        }
                                                        className="flex items-center gap-1"
                                                    >
                                                        <FileText className="w-4 h-4" />
                                                        View Voucher
                                                    </Button>
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
    );
};

export default RefundVoucherPage;
