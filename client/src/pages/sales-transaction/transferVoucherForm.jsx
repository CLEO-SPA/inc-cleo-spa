import React, { useEffect, useState } from "react";
import api from '@/services/api';
import { IoAddOutline } from "react-icons/io5";

const TransferVoucherForm = ({ setTransferFormData }) => {
    const [voucherTemplates, setVoucherTemplates] = useState([]);
    const [selectedVoucherName, setSelectedVoucherName] = useState("");
    const [selectedVoucher, setSelectedVoucher] = useState(null);
    const [memberVouchers, setMemberVouchers] = useState([]);

    const [bypassTemplate, setBypassTemplate] = useState(false);
    const [price, setPrice] = useState("");
    const [foc, setFoc] = useState("");
    const [error, setError] = useState("");

    const [oldVouchers, setOldVouchers] = useState([""]);

    const [members, setMembers] = useState([]);
    const [memberQuery, setMemberQuery] = useState("");
    const [filteredMembers, setFilteredMembers] = useState([]);
    const [selectedMember, setSelectedMember] = useState(null);

    const fetchMembers = async () => {
        try {
            const res = await api.get("/m/all");
            if (res.status === 200) setMembers(res.data);
        } catch (err) {
            console.error("Failed to fetch members:", err);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchAllVoucherNames = async () => {
        try {
            const response = await api.get("/voucher/vm");
            if (response.status === 200) {
                const sorted = response.data.data.sort((a, b) =>
                    a.voucher_template_name.localeCompare(b.voucher_template_name)
                );
                setVoucherTemplates(sorted);
                setError("");
            } else {
                setError("Failed to load voucher templates.");
            }
        } catch (err) {
            console.error("Failed to fetch voucher names:", err);
            setError("Failed to load voucher templates.");
        }
    };

    useEffect(() => {
        fetchAllVoucherNames();
    }, []);

    const handleVoucherChange = async (e) => {
        const selectedName = e.target.value;
        setSelectedVoucherName(selectedName);
        try {
            const res = await api.get(`/voucher?name=${encodeURIComponent(selectedName)}`);
            const vouchers = res.data.data;
            if (!vouchers || vouchers.length === 0) {
                setSelectedVoucher(null);
                setPrice("");
                setFoc("");
                return;
            }
            const voucher = vouchers[0];
            setSelectedVoucher(voucher);

            if (!bypassTemplate) {
                setPrice(voucher.default_total_price || "");
                setFoc(voucher.default_free_of_charge || "");
            }
        } catch (err) {
            console.error("Error fetching voucher details:", err);
            setError("Failed to fetch voucher details.");
        }
    };

    const handleBypassToggle = () => {
        const newBypass = !bypassTemplate;
        setBypassTemplate(newBypass);
        if (newBypass) {
            setPrice("");
            setFoc("");
        } else if (selectedVoucher) {
            setPrice(selectedVoucher.default_total_price || "");
            setFoc(selectedVoucher.default_free_of_charge || "");
        }
    };

    const fetchMemberVoucher = async (name) => {
        if (!name) return;
        try {
            const response = await api.get(`/voucher/m?name=${encodeURIComponent(name)}`);
            if (response.status === 200) {
                setMemberVouchers(response.data.data);
            } else {
                setMemberVouchers([]);
            }
        } catch (error) {
            console.error("Error fetching member vouchers:", error);
            setMemberVouchers([]);
        }
    };

    const totalOldBalance = oldVouchers.reduce((acc, voucherName) => {
        const voucher = memberVouchers.find(mv => mv.member_vouchers_name === voucherName);
        return acc + (voucher ? Number(voucher.current_balance) : 0);
    }, 0);

    const priceNumber = Number(price) || 0;
    const isBalanceGreater = totalOldBalance > priceNumber;
    const topUpBalance = Math.max(0, priceNumber - totalOldBalance);

    useEffect(() => {
        if (!selectedMember || !selectedVoucherName) return;

        const oldVoucherDetails = oldVouchers
            .map(name => memberVouchers.find(v => v.member_vouchers_name === name))
            .filter(Boolean);

        const payload = {
            member_name: selectedMember.member_name,
            voucher_template_name: selectedVoucherName,
            price: Number(price),
            foc: Number(foc),
            old_voucher_names: oldVouchers,
            old_voucher_details: oldVoucherDetails,
        };

        setTransferFormData(payload);
    }, [selectedMember, selectedVoucherName, price, foc, oldVouchers, memberVouchers, setTransferFormData]);

    return (
        <div className="flex flex-col lg:flex-row gap-6 p-6">
            <div className="lg:w-1/3 bg-white shadow p-4 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Cart</h2>
                <div className="flex justify-between items-center border-b py-2">
                    <span>All Back Facial</span>
                    <span className="text-sm text-gray-400">$118.00</span>
                </div>
                <button className="text-red-500 text-sm mt-2">Remove</button>
            </div>

            <div className="lg:w-2/3 bg-white shadow p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Transfer Voucher</h2>

                <div className="mb-6">
                    <label className="block font-medium mb-1">New Voucher Name</label>
                    <select
                        className="w-full border px-3 py-2 rounded"
                        value={selectedVoucherName}
                        onChange={handleVoucherChange}
                    >
                        <option value="" disabled>Select a voucher template</option>
                        {voucherTemplates.map((voucher) => (
                            <option key={voucher.id} value={voucher.voucher_template_name}>
                                {voucher.voucher_template_name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mb-6 flex flex-col md:flex-row md:items-end gap-4">
                    <div className="flex-1">
                        <label className="block font-medium mb-1">Price of New Voucher</label>
                        <input
                            type="number"
                            className="w-full border px-3 py-2 rounded"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            disabled={!bypassTemplate}
                            placeholder={bypassTemplate ? "Enter price" : ""}
                        />
                    </div>
                    <div className="flex flex-col items-center">
                        <label className="text-sm font-medium mb-1 whitespace-nowrap">Bypass Template</label>
                        <label className="inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={bypassTemplate}
                                onChange={handleBypassToggle}
                            />
                            <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-blue-500 relative">
                                <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 transition peer-checked:translate-x-5"></div>
                            </div>
                        </label>
                    </div>
                </div>

                <div className="mb-6">
                    <label className="block font-medium mb-1">FOC</label>
                    <input
                        type="number"
                        className="w-full border px-3 py-2 rounded"
                        value={foc}
                        onChange={(e) => setFoc(e.target.value)}
                        disabled={!bypassTemplate}
                        placeholder={bypassTemplate ? "Enter FOC" : ""}
                    />
                </div>

                <div className="mb-6">
                    <label className="block font-medium mb-1">Old Voucher(s)</label>
                    {oldVouchers.map((voucherName, index) => (
                        <div key={index} className="mb-2 flex items-center gap-2">
                            <select
                                className="border px-3 py-2 rounded w-full"
                                value={voucherName}
                                onChange={(e) => {
                                    const updated = [...oldVouchers];
                                    updated[index] = e.target.value;
                                    setOldVouchers(updated);
                                }}
                            >
                                <option value="">Select old voucher</option>
                                {memberVouchers
                                    .filter(
                                        (mv) =>
                                            !oldVouchers.includes(mv.member_vouchers_name) ||
                                            mv.member_vouchers_name === voucherName
                                    )
                                    .map((mv) => (
                                        <option key={mv.id} value={mv.member_vouchers_name}>
                                            {mv.member_vouchers_name} (Balance: {mv.current_balance})
                                        </option>
                                    ))}
                            </select>
                            {index !== 0 && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const updated = oldVouchers.filter((_, i) => i !== index);
                                        setOldVouchers(updated);
                                    }}
                                    className="text-red-500 font-bold text-xl"
                                    title="Remove this voucher"
                                >
                                    &times;
                                </button>
                            )}
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() => setOldVouchers([...oldVouchers, ""])}
                        className="mt-2 flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                    >
                        <IoAddOutline className="text-lg" />
                        Add Another Old Voucher
                    </button>
                </div>

                <div className="mb-4">
                    <label className="block font-medium mb-1">Balance of Old Vouchers</label>
                    <input
                        type="text"
                        className="w-full border px-3 py-2 rounded"
                        value={totalOldBalance}
                        readOnly
                    />
                </div>

                {isBalanceGreater && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                        Warning: Total balance of old vouchers exceeds the price of the new voucher!
                    </div>
                )}

                <div className="mb-6">
                    <label className="block font-medium mb-1">To Be Topped Up</label>
                    <input
                        type="text"
                        className="w-full border px-3 py-2 rounded"
                        value={topUpBalance}
                        readOnly
                    />
                </div>
            </div>
        </div>
    );
};

export default TransferVoucherForm;
