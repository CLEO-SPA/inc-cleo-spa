import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { SiteHeader } from "@/components/site-header";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import useRefundStore from "@/stores/useRefundStore";
import { useAuth } from "@/context/AuthContext";
import useEmployeeStore from "@/stores/useEmployeeStore";

const RefundVoucherForm = () => {
    const { voucherId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [remarks, setRemarks] = useState("");
    const [refundDate, setRefundDate] = useState(() => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 16);
    });

    const [isSuccess, setIsSuccess] = useState(false);
    const [refundId, setRefundId] = useState(null);
    const [error, setError] = useState(null);
    const [creditNoteNo, setCreditNoteNo] = useState("");

    const {
        fetchMemberVoucherById,
        selectedVoucher: memberVoucherDetail,
        isLoading,
        submitRefundMemberVoucher,
    } = useRefundStore();


    useEffect(() => {
        if (voucherId) fetchMemberVoucherById(Number(voucherId));
        //console.log("Fetching voucher with ID:", voucherId);
    }, [voucherId]);

    const [handledById, setHandledById] = useState(null);

    const {
        employees,
        isLoading: isLoadingEmployees,
        fetchDropdownEmployees
    } = useEmployeeStore();

    useEffect(() => {
        fetchDropdownEmployees()
    }, []);

    const handleSubmit = async () => {
        const createdById = user?.user_id;

        if (!createdById || !handledById) {
            setError("Please select a staff to handle this refund.");
            return;
        }

        const formattedDate = new Date(refundDate).toISOString();

        try {
            console.log("date:", refundDate);
            const data = await submitRefundMemberVoucher({
                memberVoucherId: Number(voucherId),
                refundedBy: Number(handledById),  
                createdBy: createdById,     
                refundDate: formattedDate,
                remarks: remarks.trim() === "" ? null : remarks,
                creditNoteNumber: creditNoteNo.trim() === "" ? null : creditNoteNo.trim(),
            });
            setRefundId(data.refundTransactionId);
            setIsSuccess(true);
        } catch (err) {
            setError(err?.message);
        }
    };

    if (isLoading) {
        return <div className="p-6 text-center text-gray-600">Loading voucher...</div>;
    }

    if (!memberVoucherDetail) {
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
                                    <h1 className="text-lg font-semibold text-gray-900">Refund Member Voucher</h1>
                                </div>
                            </div>

                            <div className="p-6 max-w-3xl mx-auto w-full">
                                <Card>
                                    <CardContent className="p-8 text-center text-gray-600">
                                        <div className="space-y-4">
                                            <h2 className="text-xl font-semibold text-gray-800">Member voucher not found</h2>
                                            <p className="text-sm">The voucher you're trying to refund doesn't exist or may have been removed.</p>
                                            <Button
                                                onClick={() => navigate(-1)}
                                                className="mt-4 bg-gray-800 hover:bg-black text-white"
                                            >
                                                Back to Previous Page
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </SidebarInset>
                    </div>
                </SidebarProvider>
            </div>
        );
    }


    const { voucher, member } = memberVoucherDetail;

    // Check if voucher is already refunded or non-refundable
    if (voucher.refundable_amount <= 0 || voucher.status === "disabled") {
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
                                    <h1 className="text-lg font-semibold text-gray-900">Refund Member Voucher</h1>
                                </div>
                            </div>

                            <div className="p-6 max-w-3xl mx-auto w-full">
                                <Card>
                                    <CardContent className="p-8 text-center text-gray-600">
                                        <div className="space-y-4">
                                            <h2 className="text-xl font-semibold text-gray-800">Voucher Already Refunded or Non-Refundable</h2>
                                            <p className="text-sm">
                                                This voucher has no refundable balance left or has already been refunded.
                                            </p>
                                            <Button onClick={() => navigate(-1)} className="mt-4 bg-gray-800 hover:bg-black text-white">
                                                Back to Previous Page
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </SidebarInset>
                    </div>
                </SidebarProvider>
            </div>
        );
    }

    if (isSuccess) {
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

                            <div className="p-8 max-w-3xl mx-auto mt-8 bg-gray-50 border border-gray-300 rounded-lg shadow-md text-gray-900">
                                <div className="flex flex-col items-center space-y-4">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-12 w-12 text-green-600"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>

                                    <h2 className="text-3xl font-bold">Refund Successful!</h2>

                                    <div className="w-full border-t border-gray-300 mt-1 pt-4"></div>

                                    <div className="w-full text-left space-y-2">
                                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Customer Information</h3>
                                        <p><span className="font-semibold">Name:</span> {member.name || "Walk-in Customer"}</p>
                                        {member.email && <p><span className="font-semibold">Email:</span> {member.email}</p>}
                                        {member.contact && <p><span className="font-semibold">Contact:</span> {member.contact}</p>}
                                    </div>

                                    <p className="text-sm text-gray-500 mt-6">
                                        Refund Transaction ID: <code className="font-mono bg-gray-200 px-2 py-1 rounded">{refundId}</code>
                                    </p>

                                    <Button
                                        className="mt-6 px-8 py-3 bg-gray-900 hover:bg-black rounded-md text-white font-semibold"
                                        onClick={() => navigate(-1)}
                                    >
                                        Back to Previous Page
                                    </Button>
                                </div>
                            </div>
                        </SidebarInset>
                    </div>
                </SidebarProvider>
            </div>
        );
    }



    return (
        <div className="[--header-height:calc(theme(spacing.14))]">
            <SidebarProvider className="flex flex-col">
                <SiteHeader />
                <div className="flex flex-1">
                    <AppSidebar />
                    <SidebarInset>
                        <div className="bg-white border-b px-4 py-3">
                            <div className="max-w-5xl mx-auto w-full flex items-center space-x-3">
                                <Button
                                    variant="ghost"
                                    onClick={() => navigate(-1)}
                                    className="flex items-center"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-1" /> Back
                                </Button>
                                <h1 className="text-lg font-semibold">Refund Member Voucher</h1>
                            </div>
                        </div>

                        <div className="p-6 max-w-5xl mx-auto w-full">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-gray-900">{voucher.member_voucher_name}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Customer Info */}
                                    <div className="space-y-1">
                                        <div className="text-sm text-gray-800 flex items-center gap-2">
                                            <User className="w-4 h-4" />
                                            {member.name || "Walk-in Customer"}
                                        </div>
                                        {(member.email || member.contact) && (
                                            <div className="text-sm text-gray-600 ml-6">
                                                {member.email && <div>Email: {member.email}</div>}
                                                {member.contact && <div>Contact: {member.contact}</div>}
                                            </div>
                                        )}
                                    </div>

                                    {/* Voucher Info */}
                                    <div className="space-y-4 text-sm text-gray-700">
                                        <div>
                                            <strong>Created At:</strong> {new Date(voucher.created_at).toLocaleString()}
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <strong>Starting Balance:</strong><br />
                                                ${voucher.starting_balance}
                                            </div>
                                            <div>
                                                <strong title="Free value given to member (excluded from actual payment)">
                                                    Free of Charge (FOC):
                                                </strong><br />
                                                <span className="text-blue-700 font-medium">${voucher.free_of_charge || "0.00"}</span>
                                            </div>
                                            <div>
                                                <strong>Default Total Price:</strong><br />
                                                ${voucher.default_total_price}
                                            </div>
                                        </div>
                                        <div>
                                            <strong>Current Balance:</strong>{" "}
                                            <span className="text-gray-800">${voucher.current_balance}</span>
                                        </div>
                                        <div>
                                            <strong>Refundable Amount:</strong>{" "}
                                            <span className="text-green-700 font-semibold">${voucher.refundable_amount?.toFixed(2)}</span>
                                        </div>
                                    </div>


                                    {/* Date & Remarks */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-1">
                                            <Label htmlFor="refundDate">Refund Date & Time</Label>
                                            <Input
                                                id="refundDate"
                                                type="datetime-local"
                                                value={refundDate}
                                                onChange={(e) => setRefundDate(e.target.value)}
                                                className="h-10 text-sm w-60"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="handledBy">Handled By</Label>
                                            <select
                                                id="handledBy"
                                                value={handledById ?? ""}
                                                onChange={(e) => setHandledById(e.target.value)}
                                                className="border rounded px-3 py-2 text-sm w-60"
                                            >
                                                <option value="">Select a staff</option>
                                                {employees.map((emp) => (
                                                    <option key={emp.id} value={emp.id}>
                                                        {emp.employee_name}
                                                    </option>
                                                ))}
                                            </select>
                                            {isLoadingEmployees && <p className="text-sm text-gray-500">Loading staff...</p>}
                                        </div>

                                        <div className="space-y-1">
                                            <Label htmlFor="creditNoteNo">Manual Credit Note No. (optional)</Label>
                                            <Input
                                                id="creditNoteNo"
                                                type="text"
                                                placeholder="e.g. CFS 001"
                                                value={creditNoteNo}
                                                onChange={(e) => setCreditNoteNo(e.target.value)}
                                                className="h-10 text-sm w-60"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <Label htmlFor="remarks">Remarks</Label>
                                            <Textarea
                                                id="remarks"
                                                value={remarks}
                                                onChange={(e) => setRemarks(e.target.value)}
                                                placeholder="e.g. Refunded due to customer cancellation"
                                            />
                                        </div>
                                    </div>

                                    {error && <div className="text-red-600 text-sm">{error}</div>}

                                    <Button onClick={handleSubmit} className="bg-gray-800 hover:bg-black">
                                        Confirm Refund
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </SidebarInset>
                </div>
            </SidebarProvider>
        </div>
    );
};

export default RefundVoucherForm;
