import React, { useState, useEffect } from 'react';
import { LuCalendar } from 'react-icons/lu';
import Navbar from '@/components/Navbar';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, parseISO } from 'date-fns';
import { api } from '../../interceptors/axios';
import { useTranslation } from "@/context/TranslationContext";
import AutoTranslateContent from "@/components/translator/AutoTranslateContent";


const DailyMembershipAccountPage = () => {
    const { t } = useTranslation(); // Use the t function for translations
    const [salesData, setSalesData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const invoicesPerPage = 3;

    const [selectedDate, setSelectedDate] = useState(() => {
        const storedDate = localStorage.getItem('formattedDate');
        if (storedDate) {
            const [day, month, year] = storedDate.split('-').map(Number);
            return new Date(year, month - 1, day);
        }
        return new Date(); // Default to current date if none is stored
    });

    useEffect(() => {
        // Update localStorage whenever the date changes
        const formattedDate = `${selectedDate.getDate().toString().padStart(2, '0')}-${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}-${selectedDate.getFullYear()}`;
        localStorage.setItem('formattedDate', formattedDate);

        fetchAllMembershipAccountSales();
    }, [selectedDate]);

    const fetchAllMembershipAccountSales = async () => {
        try {
            const response = await api.get("/ci/ma");
            const allData = response.data;
            const selectedFormattedDate = format(selectedDate, "yyyy-MM-dd");

            const groupedInvoices = allData.reduce((acc, invoice) => {
                const invoiceDate = format(parseISO(invoice.invoice_created_at), "yyyy-MM-dd");
                if (invoiceDate === selectedFormattedDate) {
                    if (!acc[invoice.invoice_id]) {
                        acc[invoice.invoice_id] = {
                            ...invoice,
                            member_care_package_details: [], // Initialize an array for packages
                            payment_details: []
                        };
                    }

                    // Add package details (if they exist)
                    if (invoice.care_package_name) {
                        acc[invoice.invoice_id].member_care_package_details.push({
                            care_package_name: invoice.care_package_name,
                            adjusted_member_care_package_total_amount: invoice.adjusted_member_care_package_total_amount
                        });
                    }

                    // Add payment details (if they exist)
                    if (invoice.payment_method_name) {
                        acc[invoice.invoice_id].payment_details.push({
                            payment_method_name: invoice.payment_method_name,
                            invoice_payment_amount: invoice.invoice_payment_amount
                        });
                    }
                }
                return acc;
            }, {});

            // Convert grouped object back into an array
            const filteredResults = Object.values(groupedInvoices);

            setSalesData(allData);
            setFilteredData(filteredResults);
            setCurrentPage(1);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    const paginateData = filteredData.slice((currentPage - 1) * invoicesPerPage, currentPage * invoicesPerPage);
    const totalPages = Math.ceil(filteredData.length / invoicesPerPage);


    const handlePageClick = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    return (
        <div className="min-h-screen bg-gray-800 text-gray-100">
            <AutoTranslateContent /> {/* This will auto-translate text */}

            <Navbar />
            <main className="max-w-4xl mx-auto px-6 py-12">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-white">{t("Membership Account Sale Revenue")}</h1>
                    <p className="text-xl text-gray-400 mt-2">
                        {t("Report for")} {format(selectedDate, "dd/MM/yyyy")} ({format(selectedDate, 'EEEE')})
                    </p>
                </div>

                <div className="bg-gray-700 p-8 rounded-xl shadow-xl border border-gray-600 flex flex-col items-center mb-8">
                    <label className="text-lg font-medium text-white mb-4">{t("Select Date")}</label>
                    <div className="relative">
                        <LuCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white" />
                        <DatePicker
                            selected={selectedDate}
                            onChange={(date) => setSelectedDate(date)}
                            dateFormat="dd/MM/yyyy"
                            className="pl-10 pr-4 py-2 border border-gray-600 rounded-lg bg-gray-600 text-white focus:outline-none"
                        />
                    </div>
                </div>

                <div className="space-y-6">
                    {paginateData.length > 0 ? (
                        paginateData.map((invoice) => (
                            <div key={invoice.invoice_id} className="bg-gray-700 p-6 rounded-xl shadow-lg border border-gray-600">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-xl font-semibold text-white">{t("Invoice ID")}: {invoice.invoice_id}</h3>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg text-white">${invoice.invoice_payment_amount}</p>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <div className="flex justify-between">
                                        <p><strong>{t("Member name")}: </strong> {invoice.member_name}</p>
                                        <p><strong>{t("Date & Time")}: </strong>{format(parseISO(invoice.invoice_created_at), "dd/MM/yyyy HH:mm:ss")}</p>
                                    </div>
                                    <div className="flex justify-between mt-2">
                                        <p><strong>{t("Manual Invoice No")}: </strong>{invoice.manual_invoice_no}</p>
                                        <p><strong>{t("Reference Invoice")}: </strong>{invoice.reference_invoice_id || t("N/A")}</p>
                                    </div>

                                    {/* Membership Account Details Table */}
                                    <div className="mt-6">
                                        <h4 className="text-lg font-semibold text-white">{t("Membership Account Details")}</h4>
                                        <table className="min-w-full mt-4 table-auto border-4 border-black">
                                            <thead>
                                                <tr className="bg-white text-black">
                                                    <th className="px-4 py-2 w-1/2 border-2 border-black">{t("Care Package Name")}</th>
                                                    <th className="px-4 py-2 w-1/2 border-2 border-black">{t("Balance of Unspent Stored Value")}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {invoice.member_care_package_details && invoice.member_care_package_details.length > 0 ? (
                                                    invoice.member_care_package_details.map((packageDetail, index) => (
                                                        <tr key={index}>
                                                            <td className="px-4 py-2 bg-gray-100/30 text-center border-2 border-black">{packageDetail.care_package_name}</td>
                                                            <td className="px-4 py-2 bg-gray-100/30 text-center border-2 border-black">${packageDetail.adjusted_member_care_package_total_amount}</td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="2" className="px-4 py-2 text-center text-gray-400 border border-black">
                                                            {t("No membership account details available.")}.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Payment Details Table */}
                                    <div className="mt-6">
                                        <h4 className="text-lg font-semibold text-white">{t("Payment Details")}</h4>
                                        <table className="min-w-full mt-4 table-auto border-4 border-black">
                                            <thead>
                                                <tr className="bg-white text-black">
                                                    <th className="px-4 py-2 w-1/2 border-2 border-black">{t("Payment Method")}</th>
                                                    <th className="px-4 py-2 w-1/2 border-2 border-black">{t("Amount")}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {invoice.payment_details && invoice.payment_details.length > 0 ? (
                                                    invoice.payment_details.map((paymentDetail, index) => (
                                                        <tr key={index}>
                                                            <td className="px-4 py-2 bg-gray-100/30 text-center border-2 border-black">{paymentDetail.payment_method_name}</td>
                                                            <td className="px-4 py-2 bg-gray-100/30 text-center border-2 border-black">${paymentDetail.invoice_payment_amount}</td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="2" className="px-4 py-2 text-center text-gray-400 border border-black">
                                                            {t("No payment details available.")}.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-white text-center mt-4">{t("No sales found for this date.")}</p>
                    )}
                </div>
            </main>
        </div>
    );
};

export default DailyMembershipAccountPage;
