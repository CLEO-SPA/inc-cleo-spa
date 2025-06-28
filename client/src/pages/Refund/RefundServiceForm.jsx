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

const RefundServiceForm = () => {
    const { saleTransactionItemId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [remarks, setRemarks] = useState("");
    const [quantity, setQuantity] = useState(1);

    const [isSuccess, setIsSuccess] = useState(false);
    const [refundId, setRefundId] = useState(null);


    const getLocalDateTimeString = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 16);
    };

    const [refundDate, setRefundDate] = useState(getLocalDateTimeString);
    const [error, setError] = useState(null);

    const {
        serviceItem,
        isLoading,
        fetchServiceItemById,
        submitRefundService,
    } = useRefundStore();

    useEffect(() => {
        if (saleTransactionItemId) fetchServiceItemById(Number(saleTransactionItemId));
    }, [saleTransactionItemId, fetchServiceItemById]);

    useEffect(() => {
        if (serviceItem) {
            setRemarks(serviceItem.remarks || "");
            setQuantity(serviceItem.remaining_quantity || 1);
        }
    }, [serviceItem]);

    const handleQuantityChange = (e) => {
        const val = Number(e.target.value);
        if (val < 1) return;
        if (serviceItem && val > serviceItem.remaining_quantity) {
            setQuantity(serviceItem.remaining_quantity);
        } else {
            setQuantity(val);
        }
    };

    const handleSubmit = async () => {
        const employeeId = user?.user_id;

        if (!employeeId) {
            console.error("Employee ID is missing. Please log in again.");
            return;
        }

        //console.log(user);
        /*
        console.log("Submitting refund:", {
            saleTransactionItemId,
            remarks,
            quantity,
            refundDate,
            employeeId,
            saleTransactionId: serviceItem.sale_transactions_id
        });
        */

        try {
            const refundData = await submitRefundService({
                saleTransactionId: serviceItem.sale_transactions_id,
                saleTransactionItemId,
                remarks,
                quantity,
                refundDate,
                employeeId: user?.user_id,
                servicename: serviceItem.service_name,
                originalUnitPrice: serviceItem.original_unit_price,
                customUnitPrice: serviceItem.custom_unit_price,
                discountPercentage: serviceItem.discount_percentage,
                amount: refundAmount,
            });

            setIsSuccess(true);
            setRefundId(refundData.refundTransactionId);
            //console.log("Refund successful:", refundData.refundTransactionId);
        } catch (error) {
            console.error("Refund failed:", error.message);
        }
    };

    if (isLoading || !serviceItem) {
        return (
            <div className="p-6 max-w-5xl mx-auto text-center text-gray-600">
                Loading service item...
            </div>
        );
    }

    if (serviceItem.is_fully_refunded) {
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
                                    <h1 className="text-lg font-semibold text-gray-900">
                                        Service Refund
                                    </h1>
                                </div>
                            </div>

                            <div className="p-6 max-w-4xl mx-auto mt-10">
                                <div className="bg-red-50 border border-red-200 rounded-lg shadow-sm px-6 py-8 text-center">
                                    <div className="flex flex-col items-center space-y-4">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-10 w-10 text-red-500"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>

                                        <h2 className="text-2xl font-semibold text-red-700">
                                            This service has already been fully refunded.
                                        </h2>

                                        <p className="text-gray-700 text-sm">
                                            {serviceItem.message || "No further refunds can be processed for this item."}
                                        </p>

                                        <Button
                                            onClick={() => navigate(-1)}
                                            className="mt-4 bg-gray-800 hover:bg-black text-white"
                                        >
                                            Back to Previous Page
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </SidebarInset>
                    </div>
                </SidebarProvider>
            </div>
        );
    }

    const {
        service_name,
        original_unit_price,
        custom_unit_price,
        discount_percentage,
        quantity: originalQuantity,
        remaining_quantity,
        amount,
        member_name,
        member_email,
        member_contact,
        transaction_created_at: created_at,
    } = serviceItem;


    const discountDecimal = parseFloat(discount_percentage ?? "1");
    const discountPercent = ((1 - discountDecimal) * 100).toFixed(0);

    const discountText =
        discountDecimal < 1
            ? `${discountDecimal} (${discountPercent}% discount)`
            : "No discount";

    const unitPrice = parseFloat(custom_unit_price ?? original_unit_price ?? "0");
    const refundAmount = quantity * unitPrice;

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

                        {isSuccess ? (
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

                                    {/* Customer Info */}
                                    <div className="w-full text-left space-y-2">
                                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Customer Information</h3>
                                        <p><span className="font-semibold">Name:</span> {member_name || "Walk-in Customer"}</p>
                                        {member_email && <p><span className="font-semibold">Email:</span> {member_email}</p>}
                                        {member_contact && <p><span className="font-semibold">Contact:</span> {member_contact}</p>}
                                    </div>

                                    {/* Refund Transaction ID */}
                                    <p className="text-sm text-gray-500 mt-6">
                                        Refund Transaction ID: <code className="font-mono bg-gray-200 px-2 py-1 rounded">{refundId}</code>
                                    </p>

                                    <Button
                                        className="mt-6 px-8 py-3 bg-gray-900 hover:bg-black rounded-md text-white font-semibold tracking-wide transition-colors duration-200"
                                        onClick={() => navigate(-1)}
                                    >
                                        Back to Previous Page
                                    </Button>
                                </div>
                            </div>

                        ) : (
                            <>

                                <div className="p-6 max-w-5xl mx-auto w-full">
                                    <Card className="w-full shadow-sm">
                                        <CardHeader>
                                            <CardTitle className="text-gray-900">{service_name}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            {/* Customer info */}
                                            <div className="space-y-1">
                                                <Label>Customer</Label>
                                                <div className="text-sm text-gray-800 flex items-center gap-2">
                                                    <User className="w-4 h-4" />
                                                    {member_name || "Walk-in Customer"}
                                                </div>
                                                {(member_email || member_contact) && (
                                                    <div className="text-sm text-gray-600 ml-6">
                                                        {member_email && <div>Email: {member_email}</div>}
                                                        {member_contact && <div>Contact: {member_contact}</div>}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Service Details */}
                                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                                                <div>
                                                    <strong>Original Unit Price:</strong> {original_unit_price}
                                                </div>
                                                <div>
                                                    <strong>Custom Unit Price:</strong>{" "}
                                                    {custom_unit_price ? custom_unit_price : "-"}
                                                </div>
                                                <div>
                                                    <strong>Discount:</strong> {discountText}
                                                </div>

                                                <div>
                                                    <strong>Transaction Date & Time:</strong>{" "}
                                                    {new Date(created_at).toLocaleString()}
                                                </div>
                                                <div>
                                                    <strong>Original Quantity:</strong> {originalQuantity}
                                                </div>
                                                <div><strong>Refundable Quantity:</strong> {remaining_quantity}</div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {/* Quantity Input */}
                                                <div className="space-y-1">
                                                    <Label htmlFor="quantity" className="text-sm">Quantity to Refund</Label>
                                                    <Input
                                                        id="quantity"
                                                        type="number"
                                                        min={1}
                                                        max={remaining_quantity}
                                                        value={quantity}
                                                        onChange={handleQuantityChange}
                                                        className="h-10 text-sm w-40"
                                                    />
                                                    <small className="text-xs text-gray-500">
                                                        Max refundable quantity: {remaining_quantity}
                                                    </small>
                                                </div>

                                                {/* Refund Date Input */}
                                                <div className="space-y-1">
                                                    <Label htmlFor="refundDate" className="text-sm">Refund Date & Time</Label>
                                                    <Input
                                                        id="refundDate"
                                                        type="datetime-local"
                                                        value={refundDate}
                                                        onChange={(e) => setRefundDate(e.target.value)}
                                                        className="h-10 text-sm w-60"
                                                    />
                                                </div>
                                            </div>

                                            <div className="text-base md:text-lg text-gray-800">
                                                <strong>Refund Amount:</strong>{" "}
                                                <span className="text-green-700 font-semibold">
                                                    ${refundAmount.toFixed(2)}
                                                </span>
                                            </div>

                                            {/* Remarks */}
                                            <div className="space-y-1">
                                                <Label htmlFor="remarks">Remarks</Label>
                                                <Textarea
                                                    id="remarks"
                                                    value={remarks}
                                                    onChange={(e) => setRemarks(e.target.value)}
                                                    placeholder="e.g. Refunded due to allergic reaction"
                                                />
                                            </div>

                                            {error && <div className="text-red-600">{error}</div>}

                                            <div className="pt-2">
                                                <Button onClick={handleSubmit} className="bg-gray-800 hover:bg-black">
                                                    Confirm Refund
                                                </Button>
                                            </div>
                                        </CardContent>

                                    </Card>
                                </div>
                            </>
                        )}
                    </SidebarInset>
                </div>
            </SidebarProvider>
        </div>
    );
};

export default RefundServiceForm;