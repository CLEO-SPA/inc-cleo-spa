import React, { useEffect } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useRevenueReportStore } from '@/stores/revenue/revenueStore';
import MonthYearSelector from '@/components/revenue/revenueMonthYearSelector';
import { CheckCircle, AlertCircle } from 'lucide-react';

function DeferredRevenuePage() {
    const {
        earliestDate,
        selectedMonth,
        selectedYear,
        loading,
        error,
        deferredRevenue,
        setMonth,
        setYear,
        resultMonth,
        resultYear,
        fetchEarliestDate,
        fetchRevenueData
    } = useRevenueReportStore();

    useEffect(() => {
        fetchEarliestDate();
    }, []);

    useEffect(() => {
        if (earliestDate) {
            fetchRevenueData();
        }
    }, [earliestDate]);

    const handleGetReport = () => {
        fetchRevenueData();
    };

    const mvPreviousDeferred = deferredRevenue.mv?.previous_total_deferred_amount || 0;
    const mcpPreviousDeferred = deferredRevenue.mcp?.previous_total_deferred_amount || 0;
    const previousTotalDeferred = mvPreviousDeferred + mcpPreviousDeferred;

    const mvCurrentActivity = (deferredRevenue.mv?.income || 0) - (deferredRevenue.mv?.net_sale || 0) - (deferredRevenue.mv?.refund || 0);
    const mcpCurrentActivity = (deferredRevenue.mcp?.income || 0) - (deferredRevenue.mcp?.net_sale || 0) - (deferredRevenue.mcp?.refund || 0);
    const totalCurrentActivity = mvCurrentActivity + mcpCurrentActivity;

    const newTotalDeferred = previousTotalDeferred + totalCurrentActivity;
    const apiTotalDeferred = (deferredRevenue.mv?.deferred_amount || 0) + (deferredRevenue.mcp?.deferred_amount || 0) + previousTotalDeferred;

    if (loading && !earliestDate) {
        return <div className="p-6 text-center text-gray-600 dark:text-gray-300">Loading date restrictions...</div>;
    }

    if (error && !earliestDate) {
        return <div className="p-6 text-center text-red-500">Error loading date: {error}</div>;
    }

    return (
        <div className="[--header-height:calc(theme(spacing.14))] bg-white dark:bg-black min-h-screen text-black dark:text-white">
            <SidebarProvider className="flex flex-col">
                <SiteHeader />
                <div className="flex flex-1">
                    <AppSidebar />
                    <SidebarInset>
                        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow p-6 animate-fadeIn">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold">Deferred Revenue Report</h2>
                            </div>

                            <MonthYearSelector
                                selectedMonth={selectedMonth}
                                selectedYear={selectedYear}
                                onMonthChange={setMonth}
                                onYearChange={setYear}
                                onGetReport={handleGetReport}
                                loading={loading}
                                earliestDate={earliestDate}
                                buttonText="Get Report"
                                buttonClassName="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
                                containerClassName="flex items-center space-x-4 mb-6"
                            />

                            {error && (
                                <div className="mb-6 p-4 bg-zinc-100 dark:bg-zinc-800 border border-gray-300 dark:border-gray-600 text-red-700 dark:text-red-300 rounded-lg">
                                    <strong>Error:</strong> {error}
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                <SummaryCard
                                    title="Previous Total"
                                    value={previousTotalDeferred}
                                    subtitle={`Accumulated before ${resultMonth}, ${resultYear}`}
                                />
                                <SummaryCard
                                    title="Monthly Change"
                                    value={totalCurrentActivity}
                                    isChange
                                    subtitle={`Net activity for ${resultMonth}, ${resultYear}`}
                                />
                                <SummaryCard
                                    title="Current Total"
                                    value={apiTotalDeferred}
                                    subtitle={`Total deferred as of ${resultMonth}, ${resultYear}`}
                                />
                            </div>

                            <div className="mb-8">
                                <h3 className="text-xl font-semibold mb-4">Monthly Activity Breakdown</h3>
                                <div className="bg-zinc-100 dark:bg-zinc-800 rounded-xl p-6 border border-gray-300 dark:border-gray-600">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                                        <BreakdownBox label="Income Received" amount={(deferredRevenue.mv?.income || 0) + (deferredRevenue.mcp?.income || 0)} positive />
                                        <BreakdownBox label="Revenue Recognized" amount={(deferredRevenue.mv?.net_sale || 0) + (deferredRevenue.mcp?.net_sale || 0)} />
                                        <BreakdownBox label="Refunds Issued" amount={(deferredRevenue.mv?.refund || 0) + (deferredRevenue.mcp?.refund || 0)} />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                                <ProductCard
                                    title="Member Voucher"
                                    data={deferredRevenue.mv}
                                    previous={mvPreviousDeferred}
                                    activity={mvCurrentActivity}
                                />
                                <ProductCard
                                    title="Member Care Package"
                                    data={deferredRevenue.mcp}
                                    previous={mcpPreviousDeferred}
                                    activity={mcpCurrentActivity}
                                />
                            </div>

                            <div className="mt-6 min-h-[72px]">
                                {Math.abs(newTotalDeferred - apiTotalDeferred) > 0.01 ? (
                                    <div className="p-4 border border-gray-300 dark:border-gray-600 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-yellow-700 dark:text-yellow-300">
                                        <strong className="flex items-center gap-1"><AlertCircle className="w-4 h-4" /> Discrepancy:</strong>
                                        Calculated total (${newTotalDeferred.toFixed(2)}) differs from API total (${apiTotalDeferred.toFixed(2)}).
                                    </div>
                                ) : (
                                    <div className="p-4 border border-gray-300 dark:border-gray-600 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-green-700 dark:text-green-300">
                                        <strong className="flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Data Verified:</strong>
                                        All calculations are consistent with the source data.
                                    </div>
                                )}
                            </div>
                        </div>
                    </SidebarInset>
                </div>
            </SidebarProvider>
        </div>
    );
}

function SummaryCard({ title, value, subtitle, isChange = false }) {
    return (
        <div className="bg-zinc-50 dark:bg-zinc-800 p-6 rounded-xl border border-gray-300 dark:border-gray-600 hover:shadow-md transition-transform transform hover:scale-[1.01]">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">{title}</div>
            <div className={`text-3xl font-bold ${isChange && value < 0 ? 'text-red-700 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                {isChange && value >= 0 ? '+' : ''}${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</div>
        </div>
    );
}

function BreakdownBox({ label, amount, positive = false }) {
    return (
        <div>
            <div className={`text-3xl font-bold ${positive ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                {positive ? '+' : '-'}${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-sm mt-1 text-gray-600 dark:text-gray-400">{label}</div>
        </div>
    );
}

function ProductCard({ title, data = {}, previous, activity }) {
    return (
        <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-zinc-200 dark:bg-zinc-800 p-4 border-b border-gray-300 dark:border-gray-600">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{title}</h3>
            </div>
            <div className="bg-white dark:bg-zinc-900 divide-y divide-gray-200 dark:divide-gray-700">
                <InfoRow label="Previous Deferred Amount" value={previous} />
                <InfoRow label="Income (Paid by Customer)" value={data.income} isPositive />
                <InfoRow label="Net Sales (Revenue Recognized)" value={data.net_sale} isNegative />
                <InfoRow label="Refunded Amount" value={data.refund} isNegative />
                <InfoRow label="Monthly Change" value={activity} isBold isChange />
                <div className="p-4 flex justify-between bg-zinc-100 dark:bg-zinc-800">
                    <span className="font-semibold text-gray-800 dark:text-white">Current Deferred Amount</span>
                    <span className="font-mono font-bold">${(data.deferred_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
            </div>
        </div>
    );
}

function InfoRow({ label, value = 0, isPositive = false, isNegative = false, isBold = false, isChange = false }) {
    const sign = isChange ? (value >= 0 ? '+' : '') : '';
    const textClass = isNegative
        ? 'text-red-700 dark:text-red-400'
        : isPositive
            ? 'text-gray-900 dark:text-white'
            : 'text-gray-700 dark:text-gray-300';

    return (
        <div className="p-4 flex justify-between">
            <span className="font-medium text-gray-700 dark:text-gray-400">{label}</span>
            <span className={`font-mono ${isBold ? 'font-bold' : ''} ${textClass}`}>
                {sign}${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
        </div>
    );
}

export default DeferredRevenuePage;
