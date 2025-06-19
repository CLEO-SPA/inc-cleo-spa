import React from "react";
import { useTranslation } from "@/context/TranslationContext";
import useTranslationStore from "@/stores/useTranslationStore";

// Validation
const isEnglishText = (text) => /^[A-Za-z\s.,!?'"()\-&$%#@*+<=>]*$/.test(text);
const isChineseText = (text) => /^[\u4e00-\u9fff\s.,!?'"()\-&$%#@*+<=>]*$/.test(text);

const TranslationForm = () => {
    const {
        english,
        chinese,
        meaningEnglish,
        meaningChinese,
        error,
        success,
        showConfirm,
        confirmTranslation,
        setEnglish,
        setChinese,
        setMeaningEnglish,
        setMeaningChinese,
        setError,
        setSuccess,
        setShowConfirm,
        setConfirmTranslation,
        addTranslation,
    } = useTranslationStore();

    const { t, fetchTranslations } = useTranslation();

    const handleSubmit = (event) => {
        event.preventDefault();

        if (!english || !chinese) {
            setError(t("Both English and Chinese fields are required.", "必须填写英文和中文字段"));
            setSuccess('');
            return;
        }

        if (!isEnglishText(english)) {
            setError(t("English field must contain only English characters.", "英文字段必须只包含英文字符。"));
            setSuccess('');
            return;
        }

        if (!isChineseText(chinese)) {
            setError(t("Chinese field must contain only Chinese characters.", "中文字段必须只包含汉字。"));
            setSuccess('');
            return;
        }

        if (meaningEnglish && !isEnglishText(meaningEnglish)) {
            setError(t("Meaning in English must contain only English characters.", "英文释义必须只包含英文字符。"));
            setSuccess('');
            return;
        }

        if (meaningChinese && !isChineseText(meaningChinese)) {
            setError(t("Meaning in Chinese must contain only Chinese characters.", "中文释义必须只包含汉字。"));
            setSuccess('');
            return;
        }

        setConfirmTranslation({
            english,
            chinese,
            meaning_in_english: meaningEnglish,
            meaning_in_chinese: meaningChinese,
        });

        setShowConfirm(true);
    };

    const handleConfirm = async () => {
        await addTranslation(fetchTranslations, t);
        setShowConfirm(false);
    };

    const handleCancel = () => setShowConfirm(false);

    return (
        <div className="min-h-screen p-6">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-lg bg-white rounded-xl shadow-lg p-8 space-y-6"
                autoComplete="off"
            >
                <h1 className="text-3xl font-bold text-center text-blue-700 mb-4">
                    {t("Add New Translation", "添加新翻译")}
                </h1>

                <div>
                    <label htmlFor="english" className="block text-md font-semibold text-gray-700 mb-1">
                        {t("English", "英文")}
                    </label>
                    <input
                        id="english"
                        type="text"
                        value={english}
                        onChange={(e) => setEnglish(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg"
                        placeholder={t("Enter English word", "输入英文单词")}
                    />
                </div>

                <div>
                    <label htmlFor="chinese" className="block text-md font-semibold text-gray-700 mb-1">
                        {t("Chinese", "中文")}
                    </label>
                    <input
                        id="chinese"
                        type="text"
                        value={chinese}
                        onChange={(e) => setChinese(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg"
                        placeholder={t("Enter Chinese translation", "输入中文翻译")}
                    />
                </div>

                <div>
                    <label htmlFor="meaningEnglish" className="block text-md font-semibold text-gray-700 mb-1">
                        {t("Meaning in English", "英文释义")}
                    </label>
                    <input
                        id="meaningEnglish"
                        type="text"
                        value={meaningEnglish}
                        onChange={(e) => setMeaningEnglish(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg"
                        placeholder={t("English meaning", "英文释义")}
                    />
                </div>

                <div>
                    <label htmlFor="meaningChinese" className="block text-md font-semibold text-gray-700 mb-1">
                        {t("Meaning in Chinese", "中文释义")}
                    </label>
                    <input
                        id="meaningChinese"
                        type="text"
                        value={meaningChinese}
                        onChange={(e) => setMeaningChinese(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg"
                        placeholder={t("Chinese meaning", "中文释义")}
                    />
                </div>

                {error && <div className="text-red-600 bg-red-100 rounded-md p-3">{error}</div>}
                {success && <div className="text-green-700 bg-green-100 rounded-md p-3">{success}</div>}

                <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold"
                >
                    {t("Add Translation", "添加翻译")}
                </button>
            </form>

            {showConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
                        <h2 className="text-2xl font-bold text-blue-700 mb-4 text-center">
                            {t("Confirm Translation", "确认翻译")}
                        </h2>
                        <p className="text-gray-700 mb-6 text-center">
                            {t("Are you sure this is the correct translation?", "您确定这是正确的翻译吗？")}
                        </p>
                        <div className="space-y-3 mb-6 text-gray-800">
                            <p><strong>{t("English", "英文")}:</strong> {confirmTranslation.english}</p>
                            <p><strong>{t("Chinese", "中文")}:</strong> {confirmTranslation.chinese}</p>
                            {confirmTranslation.meaning_in_english && (
                                <p><strong>{t("Meaning in English", "英文释义")}:</strong> {confirmTranslation.meaning_in_english}</p>
                            )}
                            {confirmTranslation.meaning_in_chinese && (
                                <p><strong>{t("Meaning in Chinese", "中文释义")}:</strong> {confirmTranslation.meaning_in_chinese}</p>
                            )}
                        </div>
                        <div className="flex justify-center gap-6">
                            <button
                                onClick={handleCancel}
                                className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
                            >
                                {t("Cancel", "取消")}
                            </button>
                            <button
                                onClick={handleConfirm}
                                className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                            >
                                {t("Confirm", "确认")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TranslationForm;
