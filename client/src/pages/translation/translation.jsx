import React, { useState } from "react";
import Navbar from '@/components/Navbar';
import { api } from '../../interceptors/axios.js';
import { useTranslation } from "@/context/TranslationContext";

// Regular expression for valid English characters (including !)
const isEnglishText = (text) => /^[A-Za-z\s.,!?'"()\-&$%#@*+<=>]*$/.test(text);

// Regular expression to check if the string contains only Chinese characters (including !)
const isChineseText = (text) => /^[\u4e00-\u9fff\s.,!?'"()\-&$%#@*+<=>]*$/.test(text);


const TranslationForm = () => {
    const { t, translations, fetchTranslations } = useTranslation();
    const [english, setEnglish] = useState("");
    const [chinese, setChinese] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const addTranslation = async () => {
        try {
            const response = await api.post("/trans/add", { english, chinese });

            if (response.status === 200 || response.status === 201) {
                setSuccess(t("Translation added successfully!", "翻译添加成功！"));
                setError("");
                setEnglish("");
                setChinese("");

                // Refresh translations
                await fetchTranslations();
            }
        } catch (error) {
            console.log("Error during add translation:", error);
            if (error.response?.status === 400) {
                setError(t("Translation already exists", "翻译已存在"));
            } else {
                setError(error.response?.data?.error || t("Failed to add translation.", "添加翻译失败"));
            }
            setSuccess("");
        }
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        console.log("Form submitted with:", english, chinese);

        if (!english || !chinese) {
            setError(t("Both English and Chinese fields are required.", "必须填写英文和中文字段"));
            setSuccess("");
            return;
        }

        // Check if the English text contains only valid English characters
        if (!isEnglishText(english)) {
            setError(t("English field must contain only English characters.", "英文字段必须只包含英文字符。"));
            setSuccess("");
            return;
        }

        // Check if the Chinese text contains only valid Chinese characters
        if (!isChineseText(chinese)) {
            setError(t("Chinese field must contain only Chinese characters.", "中文字段必须只包含汉字。"));
            setSuccess("");
            return;
        }

        addTranslation();
    };

    return (
        <div className="bg-gray-100 text-black min-h-screen flex flex-col">
            <Navbar />
            {/* Full height container with flexbox to center the form */}
            <div className="flex-1 flex items-center justify-center">
                <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full mb-20"> {/* Added margin-top */}
                    <div className="mb-4">
                        <label className="block text-lg font-semibold mb-2">
                            {t("English", "英文")}
                        </label>
                        <input
                            type="text"
                            value={english}
                            onChange={(e) => setEnglish(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg text-lg bg-white text-black"
                            placeholder={`${t("Enter English word", "输入英文单词")}`}
                        />

                    </div>
                    <div className="mb-6">
                        <label className="block text-lg font-semibold mb-2">
                            {t("Chinese", "中文")}
                        </label>
                        <input
                            type="text"
                            value={chinese}
                            onChange={(e) => setChinese(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg text-lg bg-white text-black"
                            placeholder={`${t("Enter Chinese translation", "输入中文翻译")}`}
                        />

                    </div>

                    {error && <div className="text-red-500 mb-4">{error}</div>}
                    {success && <div className="text-green-500 mb-4">{success}</div>}

                    <button type="submit" className="w-full bg-blue-500 text-white py-3 rounded-lg text-lg font-semibold hover:bg-blue-600">
                        {t("Add Translation", "添加翻译")}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default TranslationForm;
