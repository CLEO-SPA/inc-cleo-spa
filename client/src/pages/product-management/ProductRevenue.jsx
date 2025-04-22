import React, { useEffect, useState } from 'react';
import { productRevenueApi } from './ProductRevenueApi';
import MonthYearPicker from '@/components/datepicker/MonthYearPicker';
import "react-datepicker/dist/react-datepicker.css";
import ProductRevenueDetails from './ProductRevenueDetails';
import Navbar from "@/components/Navbar";

const ProductRevenue = () => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    // const [activeTab, setActiveTab] = useState('revenue');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [revenueData, setRevenueData] = useState([]);
    const [selectedViewDate, setSelectedViewDate] = useState(null);

    const getDaysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const createEmptyDayData = (day) => ({
        day,
        payment: {
            cash: 0,
            nets: 0,
            visa: 0,
            paynow: 0
        },
        refund: 0,
        netSales: 0
    });

    const processMonthData = (rawData) => {
        const daysInMonth = getDaysInMonth(selectedDate);
        const processedData = [];

        // Create a map of existing data
        const dataMap = new Map(rawData.map(item => [item.day, item]));

        // Fill in all days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            processedData.push(dataMap.get(day) || createEmptyDayData(day));
        }

        return processedData;
    };

    const fetchData = async () => {
        try {
            setIsLoading(true);
            setError(null);
            setRevenueData([]);
            const month = selectedDate.getMonth() + 1;
            const year = selectedDate.getFullYear();
            const response = await productRevenueApi.getRevenueReport(month, year);

            if (response.success) {
                const processedData = processMonthData(response.data);
                setRevenueData(processedData);
            } else {
                setError("Failed to get revenue data");
            }
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to get revenue data");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedDate]);

    const handleDateChange = (date) => {
        setSelectedDate(date);
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-SG', {
            style: 'currency',
            currency: 'SGD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount || 0);
    };

    const handleViewDetails = (day) => {
        // Create date at start of day in local timezone
        const viewDate = new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            day,
            0, 0, 0
        );

        // Adjust for timezone offset
        const offset = viewDate.getTimezoneOffset();
        viewDate.setMinutes(viewDate.getMinutes() - offset);

        setSelectedViewDate(viewDate);
    };

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-[#1a2332] text-gray-100">
                <header className="bg-[#1f2937] p-4 border-b border-gray-700">
                    <div className="max-w-7xl mx-auto">
                        <h1 className="text-2xl font-semibold">Finance</h1>
                        <p className="text-gray-400 mt-1">Product Revenue Report</p>
                    </div>
                </header>

                <main className="max-w-7xl mx-auto p-6">
                    <div className="bg-[#1f2937] rounded-lg p-6 mb-6">
                        <div className="flex gap-4 items-end">
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Select Month/Year</label>
                                <MonthYearPicker
                                    selected={selectedDate}
                                    onChange={handleDateChange}
                                    className="bg-[#1a2332] border border-gray-700 rounded-md px-3 py-2 text-gray-200"
                                />
                            </div>
                            <button
                                onClick={fetchData}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Loading...' : 'Refresh Data'}
                            </button>
                        </div>
                    </div>

                    <div className="bg-[#1f2937] rounded-lg overflow-hidden">
                        {isLoading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="text-blue-500">Loading...</div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-[#1a2332]">
                                            <th className="px-4 py-3 text-left border-b border-gray-700">Day</th>
                                            <th className="px-4 py-3 text-right border-b border-gray-700">Cash</th>
                                            <th className="px-4 py-3 text-right border-b border-gray-700">NETS</th>
                                            <th className="px-4 py-3 text-right border-b border-gray-700">VISA/MASTER</th>
                                            <th className="px-4 py-3 text-right border-b border-gray-700">PayNow</th>
                                            <th className="px-4 py-3 text-right border-b border-gray-700">Refund</th>
                                            <th className="px-4 py-3 text-right border-b border-gray-700">Net Sales</th>
                                            <th className="px-4 py-3 text-center border-b border-gray-700">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {revenueData.map((row) => (
                                            <tr
                                                key={row.day}
                                                className={`hover:bg-[#1a2332] ${row.netSales === 0 ? 'text-gray-500' : ''}`}
                                            >
                                                <td className="px-4 py-3 border-b border-gray-700">{row.day}</td>
                                                <td className="px-4 py-3 text-right border-b border-gray-700">
                                                    {formatCurrency(row.payment.cash)}
                                                </td>
                                                <td className="px-4 py-3 text-right border-b border-gray-700">
                                                    {formatCurrency(row.payment.nets)}
                                                </td>
                                                <td className="px-4 py-3 text-right border-b border-gray-700">
                                                    {formatCurrency(row.payment.visa)}
                                                </td>
                                                <td className="px-4 py-3 text-right border-b border-gray-700">
                                                    {formatCurrency(row.payment.paynow)}
                                                </td>
                                                <td className="px-4 py-3 text-right border-b border-gray-700 text-red-400">
                                                    {row.refund > 0 ? `(${formatCurrency(row.refund)})` : formatCurrency(0)}
                                                </td>
                                                <td className="px-4 py-3 text-right border-b border-gray-700">
                                                    {row.netSales < 0
                                                        ? `(${formatCurrency(Math.abs(row.netSales))})`
                                                        : formatCurrency(row.netSales)}
                                                </td>
                                                <td className="px-4 py-3 text-center border-b border-gray-700">
                                                    <button
                                                        onClick={() => handleViewDetails(row.day)}
                                                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                                    // disabled={row.netSales === 0}
                                                    >
                                                        View Breakdown
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                    {selectedViewDate && (
                        <ProductRevenueDetails
                            selectedDate={selectedViewDate}
                            onClose={() => setSelectedViewDate(null)}
                        />
                    )}
                </main>
            </div>
        </>
    );
};

export default ProductRevenue;