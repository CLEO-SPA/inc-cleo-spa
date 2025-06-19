import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";

import { useTranslation } from "@/context/TranslationContext";
import useTranslationStore from "@/stores/useTranslationStore";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarProvider } from "@/components/ui/sidebar";

const ViewTranslations = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const {
        translations,
        fetchTranslations,
        loading,
        updateTranslation,
        deleteTranslation,
    } = useTranslationStore();

    const hasFetched = useRef(false);

    const [searchQuery, setSearchQuery] = useState("");
    const [error, setError] = useState("");

    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmInput, setConfirmInput] = useState("");
    const [selectedTranslation, setSelectedTranslation] = useState(null);

    const [showEditModal, setShowEditModal] = useState(false);
    const [editInput, setEditInput] = useState("");
    const [editMeaningEn, setEditMeaningEn] = useState("");
    const [editMeaningZh, setEditMeaningZh] = useState("");
    const [editError, setEditError] = useState("");

    useEffect(() => {
        if (!hasFetched.current) {
            fetchTranslations();
            hasFetched.current = true;
        }
    }, [fetchTranslations]);

    const isChineseText = (text) =>
        /^[\u4e00-\u9fff\s.,!?'"()\-&$%#@*+<=>]*$/.test(text);

    const handleEdit = (id) => {
        const selected = translations.find((t) => t.id === id);
        if (selected) {
            setSelectedTranslation(selected);
            setEditInput(selected.chinese || "");
            setEditMeaningEn(selected.meaning_in_english || "");
            setEditMeaningZh(selected.meaning_in_chinese || "");
            setEditError("");
            setShowEditModal(true);
        }
    };

    const saveEdit = async () => {
        if (!isChineseText(editInput)) {
            setEditError(
                t(
                    "Chinese field must contain only Chinese characters.",
                    "中文字段只能包含汉字。"
                )
            );
            return;
        }

        const success = await updateTranslation(selectedTranslation.id, {
            chinese: editInput,
            meaning_in_english: editMeaningEn,
            meaning_in_chinese: editMeaningZh,
        });

        if (success) {
            setShowEditModal(false);
            setSelectedTranslation(null);
            setEditInput("");
            setEditMeaningEn("");
            setEditMeaningZh("");
            setEditError("");
            setError("");
        } else {
            setEditError(t("Failed to update translation.", "更新翻译失败。"));
        }
    };

    const confirmDelete = (translation) => {
        setSelectedTranslation(translation);
        setConfirmInput("");
        setShowConfirm(true);
    };

    const cancelDelete = () => {
        setShowConfirm(false);
        setSelectedTranslation(null);
    };

    const handleDelete = async () => {
        if (confirmInput !== selectedTranslation.english) return;

        const success = await deleteTranslation(selectedTranslation.id);

        if (success) {
            setShowConfirm(false);
            setSelectedTranslation(null);
            setError("");
        } else {
            setError(t("Failed to delete translation.", "删除翻译失败"));
        }
    };

    const filteredTranslations = translations.filter((item) =>
        item.english.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="bg-gray-100 text-black min-h-screen flex flex-col relative">
            <SidebarProvider className="flex flex-col min-h-screen">
                <SiteHeader />
                <div className="flex flex-1">
                    <AppSidebar />
                    <div className="flex-1 flex flex-col items-center px-6 py-8">
                        <h1 className="text-3xl font-bold mb-6">{t("All Translations", "所有翻译")}</h1>

                        {error && <div className="text-red-500 mb-4">{error}</div>}

                        <div className="w-full max-w-6xl mb-6 flex justify-end">
                            <button
                                onClick={() => navigate("/create-translation")}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-lg"
                            >
                                {t("Create Translation", "创建翻译")}
                            </button>
                        </div>

                        <div className="w-full max-w-6xl mb-4">
                            <input
                                type="text"
                                placeholder={t("Search by English word", "按英文单词搜索")}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg text-lg"
                            />
                        </div>

                        <div className="overflow-x-auto w-full max-w-6xl">
                            <table className="w-full bg-white border border-gray-300 rounded-lg">
                                <thead className="bg-gray-200">
                                    <tr>
                                        <th className="py-3 px-4 text-left">{t("English", "英文")}</th>
                                        <th className="py-3 px-4 text-left">{t("Chinese", "中文")}</th>
                                        <th className="py-3 px-4 text-left">{t("Meaning (English)", "英文释义")}</th>
                                        <th className="py-3 px-4 text-left">{t("Meaning (Chinese)", "中文释义")}</th>
                                        <th className="py-3 px-4 text-left">{t("Edit", "编辑")}</th>
                                        <th className="py-3 px-4 text-left">{t("Delete", "删除")}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTranslations.length > 0 ? (
                                        filteredTranslations.map((item) => (
                                            <tr key={item.id} className="border-t border-gray-300">
                                                <td className="py-2 px-4">{item.english}</td>
                                                <td className="py-2 px-4">{item.chinese}</td>
                                                <td className="py-2 px-4">{item.meaning_in_english || "-"}</td>
                                                <td className="py-2 px-4">{item.meaning_in_chinese || "-"}</td>
                                                <td className="py-2 px-4">
                                                    <button
                                                        onClick={() => handleEdit(item.id)}
                                                        className="inline-flex items-center bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded"
                                                    >
                                                        <Pencil size={16} className="mr-1" />
                                                        {t("Edit", "编辑")}
                                                    </button>
                                                </td>
                                                <td className="py-2 px-4">
                                                    <button
                                                        onClick={() => confirmDelete(item)}
                                                        className="inline-flex items-center bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                                                    >
                                                        <Trash2 size={16} className="mr-1" />
                                                        {t("Delete", "删除")}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="py-4 px-4 text-center text-gray-500">
                                                {t("No translations available.", "暂无翻译")}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Confirm Delete Popup */}
                        {showConfirm && (
                            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                                <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                                    <h2 className="text-xl font-semibold mb-4 text-red-600">{t("Confirm Deletion", "确认删除")}</h2>
                                    <p className="mb-3">
                                        {t(
                                            `Please type "${selectedTranslation.english}" to confirm deletion.`,
                                            `请输入 "${selectedTranslation.english}" 以确认删除。`
                                        )}
                                    </p>
                                    <input
                                        type="text"
                                        className="w-full p-2 border border-gray-300 rounded mb-4"
                                        value={confirmInput}
                                        onChange={(e) => setConfirmInput(e.target.value)}
                                        placeholder={t("Type here", "在此输入")}
                                    />
                                    <div className="flex justify-end space-x-2">
                                        <button
                                            onClick={cancelDelete}
                                            className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded"
                                        >
                                            {t("Cancel", "取消")}
                                        </button>
                                        <button
                                            onClick={handleDelete}
                                            disabled={confirmInput !== selectedTranslation.english}
                                            className={`${confirmInput === selectedTranslation.english
                                                    ? "bg-red-600 hover:bg-red-700"
                                                    : "bg-red-300 cursor-not-allowed"
                                                } text-white px-4 py-2 rounded`}
                                        >
                                            {t("Delete", "删除")}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Edit Modal */}
                        {showEditModal && (
                            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                                <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                                    <h2 className="text-xl font-semibold mb-4 text-yellow-600">{t("Edit Translation", "编辑翻译")}</h2>

                                    <label className="block text-sm text-gray-600 mb-1">{t("English Word", "英文词汇")}</label>
                                    <input
                                        type="text"
                                        value={selectedTranslation.english}
                                        readOnly
                                        className="w-full p-2 mb-4 border border-gray-300 rounded bg-gray-100 cursor-not-allowed"
                                    />

                                    <label className="block text-sm text-gray-600 mb-1">{t("Chinese Translation", "中文翻译")}</label>
                                    <input
                                        type="text"
                                        value={editInput}
                                        onChange={(e) => setEditInput(e.target.value)}
                                        className="w-full p-2 mb-4 border border-gray-300 rounded"
                                    />

                                    <label className="block text-sm text-gray-600 mb-1">{t("Meaning (English)", "英文释义")}</label>
                                    <input
                                        type="text"
                                        value={editMeaningEn}
                                        onChange={(e) => setEditMeaningEn(e.target.value)}
                                        className="w-full p-2 mb-4 border border-gray-300 rounded"
                                    />

                                    <label className="block text-sm text-gray-600 mb-1">{t("Meaning (Chinese)", "中文释义")}</label>
                                    <input
                                        type="text"
                                        value={editMeaningZh}
                                        onChange={(e) => setEditMeaningZh(e.target.value)}
                                        className="w-full p-2 mb-4 border border-gray-300 rounded"
                                    />

                                    {editError && <p className="text-red-600 mb-4">{editError}</p>}

                                    <div className="flex justify-end space-x-2">
                                        <button
                                            onClick={() => setShowEditModal(false)}
                                            className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded"
                                        >
                                            {t("Cancel", "取消")}
                                        </button>
                                        <button
                                            onClick={saveEdit}
                                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
                                        >
                                            {t("Save", "保存")}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </SidebarProvider>
        </div>
    );
};

export default ViewTranslations;
