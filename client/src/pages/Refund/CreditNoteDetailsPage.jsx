"use client"

import { useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import useRefundStore from "@/stores/useRefundStore"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { ArrowLeft, User, Hash, Package } from "lucide-react"

const CreditNoteDetailsPage = () => {
    const navigate = useNavigate()
    const { id } = useParams()
    const { fetchCreditNoteById, selectedCreditNote: note, isLoading, error } = useRefundStore()

    useEffect(() => {
        if (id) {
            fetchCreditNoteById(id)
        }
    }, [id])

    const isWalkIn = !note?.member_id || Number(note?.member_id) === 0

    return (
        <div className="[--header-height:calc(theme(spacing.14))]">
            <SidebarProvider className="flex flex-col">
                <SiteHeader />
                <div className="flex flex-1">
                    <AppSidebar />
                    <SidebarInset>
                        <div className="flex flex-1 flex-col gap-6 p-6">
                            <div className="max-w-5xl mx-auto w-full">
                                {/* Header */}
                                <div className="flex items-center gap-4 mb-8">
                                    <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="shrink-0">
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                        Back
                                    </Button>
                                    <div>
                                        <h1 className="text-3xl font-bold text-gray-900">Credit Note Details</h1>
                                        <p className="text-gray-600 mt-1">View refund transaction information</p>
                                    </div>
                                </div>

                                {/* Loading State */}
                                {isLoading && (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="text-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                            <p className="text-gray-600">Loading credit note details...</p>
                                        </div>
                                    </div>
                                )}

                                {/* Error State */}
                                {error && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0">
                                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </div>
                                            <div className="ml-3">
                                                <h3 className="text-sm font-medium text-red-800">Error loading credit note</h3>
                                                <p className="text-sm text-red-700 mt-1">{error}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Content */}
                                {!isLoading && note && (
                                    <div className="space-y-8">
                                        {/* Customer Info Card */}
                                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                                <div className="flex items-center gap-2">
                                                    <User className="h-5 w-5 text-gray-600" />
                                                    <h2 className="text-lg font-semibold text-gray-900">Customer Information</h2>
                                                </div>
                                            </div>
                                            <div className="p-6">
                                                {isWalkIn ? (
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                                            <User className="h-6 w-6 text-gray-600" />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-900 text-lg">Walk-in Customer</p>
                                                            <p className="text-gray-600">No member account</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                                            <User className="h-6 w-6 text-blue-600" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <h3 className="font-semibold text-gray-900 text-lg">{note.member_name}</h3>
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2 text-sm text-gray-600">
                                                                <p>
                                                                    <span className="font-medium">ID:</span> {note.member_id}
                                                                </p>
                                                                {note.member_email && (
                                                                    <p>
                                                                        <span className="font-medium">Email:</span> {note.member_email}
                                                                    </p>
                                                                )}
                                                                {note.member_contact && (
                                                                    <p>
                                                                        <span className="font-medium">Contact:</span> {note.member_contact}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Credit Note Info Card */}
                                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                                <div className="flex items-center gap-2">
                                                    <Hash className="h-5 w-5 text-gray-600" />
                                                    <h2 className="text-lg font-semibold text-gray-900">Transaction Details</h2>
                                                </div>
                                            </div>
                                            <div className="p-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-medium text-gray-600">Credit Note ID</p>
                                                        <p className="text-lg font-semibold text-gray-900">{note.id}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-medium text-gray-600">Receipt Number</p>
                                                        <p className="text-lg font-semibold text-gray-900">{note.receipt_no || "N/A"}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-medium text-gray-600">Processed At</p>
                                                        <p className="text-lg font-semibold text-gray-900">
                                                            {note.created_at
                                                                ? new Date(note.created_at).toLocaleString("en-US", {
                                                                    year: "numeric",
                                                                    month: "short",
                                                                    day: "numeric",
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                })
                                                                : "N/A"}
                                                        </p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-medium text-gray-600">Handled By</p>
                                                        <p className="text-lg font-semibold text-gray-900">{note.handled_by_name || "N/A"}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-medium text-gray-600">Refunded Amount</p>
                                                        <p className="text-2xl font-bold text-red-600">
                                                            ${Math.abs(Number(note.total_paid_amount)).toFixed(2)}
                                                        </p>
                                                    </div>
                                                    {note.remarks && (
                                                        <div className="md:col-span-2 lg:col-span-3 space-y-1">
                                                            <p className="text-sm font-medium text-gray-600">Remarks</p>
                                                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                                                <p className="text-gray-800 whitespace-pre-line">{note.remarks}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Items Section */}
                                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                                <div className="flex items-center gap-2">
                                                    <Package className="h-5 w-5 text-gray-600" />
                                                    <h2 className="text-lg font-semibold text-gray-900">Refunded Items</h2>
                                                </div>
                                            </div>
                                            <div className="p-6">
                                                <div className="space-y-6">
                                                    {note.items.map((item, index) => (
                                                        <div key={item.id} className={`${index > 0 ? "border-t border-gray-200 pt-6" : ""}`}>
                                                            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                                                                <div className="flex items-start justify-between mb-4">
                                                                    <div className="flex-1">
                                                                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                                                            {item.item_type === "service"
                                                                                ? item.service_name || "Service"
                                                                                : item.item_type === "MEMBER_CARE_PACKAGE"
                                                                                    ? item.service_name || "Care Package"
                                                                                    : "Member Voucher"}
                                                                        </h3>
                                                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                            {item.item_type.replace("_", " ")}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                {item.item_type === "service" && (
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                                                                        <div className="space-y-1">
                                                                            <p className="font-medium text-gray-700">Original Unit Price</p>
                                                                            <p className="text-gray-900">
                                                                                ${Number(item.original_unit_price || 0).toFixed(2)}
                                                                            </p>
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            <p className="font-medium text-gray-700">Custom Unit Price</p>
                                                                            <p className="text-gray-900">
                                                                                {item.custom_unit_price != null
                                                                                    ? `$${Number(item.custom_unit_price).toFixed(2)}`
                                                                                    : "-"}
                                                                            </p>
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            <p className="font-medium text-gray-700">Discount</p>
                                                                            <p className="text-gray-900">{item.discount_percentage ?? "-"}</p>
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            <p className="font-medium text-gray-700">Quantity</p>
                                                                            <p className="text-gray-900">{Math.abs(Number(item.quantity))}</p>
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            <p className="font-medium text-gray-700">Refunded Amount</p>
                                                                            <p className="text-red-600 font-semibold text-lg">
                                                                                ${Math.abs(Number(item.amount)).toFixed(2)}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Voucher Logs */}
                                                                {item.item_type === "member voucher" && note.voucherLogs && (
                                                                    <div className="mt-6 border-t border-gray-200 pt-6">
                                                                        <h4 className="text-base font-semibold mb-4 text-gray-900">
                                                                            Voucher Transaction History
                                                                        </h4>
                                                                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                                                            <div className="overflow-x-auto">
                                                                                <table className="w-full text-sm">
                                                                                    <thead className="bg-gray-50 border-b border-gray-200">
                                                                                        <tr>
                                                                                            <th className="px-4 py-3 text-left font-medium text-gray-700">Date</th>
                                                                                            <th className="px-4 py-3 text-left font-medium text-gray-700">
                                                                                                Description
                                                                                            </th>
                                                                                            <th className="px-4 py-3 text-right font-medium text-gray-700">
                                                                                                Amount Change
                                                                                            </th>
                                                                                            <th className="px-4 py-3 text-right font-medium text-gray-700">
                                                                                                Balance
                                                                                            </th>
                                                                                            <th className="px-4 py-3 text-left font-medium text-gray-700">Type</th>
                                                                                        </tr>
                                                                                    </thead>
                                                                                    <tbody className="divide-y divide-gray-200">
                                                                                        {note.voucherLogs
                                                                                            .filter((log) => log.member_voucher_id === Number(item.member_voucher_id))
                                                                                            .sort((a, b) => a.id - b.id)
                                                                                            .map((log) => (
                                                                                                <tr key={log.id} className="hover:bg-gray-50">
                                                                                                    <td className="px-4 py-3 text-gray-900">
                                                                                                        {new Date(log.service_date).toLocaleDateString()}
                                                                                                    </td>
                                                                                                    <td className="px-4 py-3 text-gray-900">{log.service_description}</td>
                                                                                                    <td className="px-4 py-3 text-right font-medium text-red-600">
                                                                                                        {Number(log.amount_change) > 0 ? "+" : ""}
                                                                                                        {log.amount_change}
                                                                                                    </td>
                                                                                                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                                                                                                        {log.current_balance}
                                                                                                    </td>
                                                                                                    <td className="px-4 py-3">
                                                                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                                                                            {log.type}
                                                                                                        </span>
                                                                                                    </td>
                                                                                                </tr>
                                                                                            ))}
                                                                                    </tbody>
                                                                                </table>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Member Care Package Details */}
                                        {note.memberCarePackageDetails && note.memberCarePackageDetails.length > 0 && (
                                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                                    <div className="flex items-center gap-2">
                                                        <Package className="h-5 w-5 text-gray-600" />
                                                        <h2 className="text-lg font-semibold text-gray-900">Member Care Package Details</h2>
                                                    </div>
                                                </div>
                                                <div className="p-6">
                                                    <div className="space-y-6">
                                                        {note.memberCarePackageDetails.map((detail, index) => (
                                                            <div
                                                                key={detail.detail_id}
                                                                className={`${index > 0 ? "border-t border-gray-200 pt-6" : ""}`}
                                                            >
                                                                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                                                                    <div className="flex items-start justify-between mb-4">
                                                                        <div className="flex-1">
                                                                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                                                                {detail.package_name}
                                                                            </h3>
                                                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                                                Member Care Package
                                                                            </span>
                                                                        </div>
                                                                    </div>


                                                                    <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
                                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                                            <div className="md:col-span-2 lg:col-span-4 space-y-1">
                                                                                <p className="text-sm font-medium text-gray-600">Service Name</p>
                                                                                <p className="text-base font-semibold text-gray-900">{detail.service_name}</p>
                                                                            </div>
                                                                            <div className="space-y-1">
                                                                                <p className="text-sm font-medium text-gray-600">Price</p>
                                                                                <p className="text-lg font-semibold text-gray-900">
                                                                                    ${Number(detail.price).toFixed(2)}
                                                                                </p>
                                                                            </div>
                                                                            <div className="space-y-1">
                                                                                <p className="text-sm font-medium text-gray-600">Discount</p>
                                                                                <p className="text-lg font-semibold text-gray-900">
                                                                                    {detail.discount && detail.discount !== "0" ? `${detail.discount}` : "-"}
                                                                                </p>
                                                                            </div>
                                                                            <div className="space-y-1">
                                                                                <p className="text-sm font-medium text-gray-600">Quantity</p>
                                                                                <p className="text-lg font-semibold text-gray-900">{detail.quantity}</p>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Mmeber Care Package Logs */}
                                                                    {note.memberCarePackageLogs?.some(
                                                                        (log) => String(log.member_care_package_details_id) === String(detail.detail_id),
                                                                    ) && (
                                                                            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                                                                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                                                                                    <h4 className="text-base font-semibold text-gray-900">Transaction History</h4>
                                                                                </div>
                                                                                <div className="overflow-x-auto">
                                                                                    <table className="w-full text-sm">
                                                                                        <thead className="bg-gray-50 border-b border-gray-200">
                                                                                            <tr>
                                                                                                <th className="px-4 py-3 text-left font-medium text-gray-700">Date</th>
                                                                                                <th className="px-4 py-3 text-left font-medium text-gray-700">Type</th>
                                                                                                <th className="px-4 py-3 text-left font-medium text-gray-700">
                                                                                                    Description
                                                                                                </th>
                                                                                                <th className="px-4 py-3 text-right font-medium text-gray-700">
                                                                                                    Amount Changed
                                                                                                </th>
                                                                                                <th className="px-4 py-3 text-right font-medium text-gray-700">
                                                                                                    Transaction Amount
                                                                                                </th>
                                                                                            </tr>
                                                                                        </thead>
                                                                                        <tbody className="divide-y divide-gray-200">
                                                                                            {note.memberCarePackageLogs
                                                                                                .filter(
                                                                                                    (log) =>
                                                                                                        String(log.member_care_package_details_id) ===
                                                                                                        String(detail.detail_id),
                                                                                                )
                                                                                                .sort(
                                                                                                    (a, b) => new Date(a.transaction_date) - new Date(b.transaction_date),
                                                                                                )
                                                                                                .map((log) => (
                                                                                                    <tr key={log.id} className="hover:bg-gray-50">
                                                                                                        <td className="px-4 py-3 text-gray-900">
                                                                                                            {new Date(log.transaction_date).toLocaleDateString()}
                                                                                                        </td>
                                                                                                        <td className="px-4 py-3">
                                                                                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                                                                {log.type}
                                                                                                            </span>
                                                                                                        </td>
                                                                                                        <td className="px-4 py-3 text-gray-900">{log.description}</td>
                                                                                                        <td className="px-4 py-3 text-right font-medium text-red-600">
                                                                                                            {log.amount_changed}
                                                                                                        </td>
                                                                                                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                                                                                                            {log.transaction_amount}
                                                                                                        </td>
                                                                                                    </tr>
                                                                                                ))}
                                                                                        </tbody>
                                                                                    </table>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </SidebarInset>
                </div>
            </SidebarProvider>
        </div>
    )
}

export default CreditNoteDetailsPage
