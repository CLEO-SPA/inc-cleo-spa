// TranslationPage.js (or wherever you're rendering TranslationForm)
import React from "react";
import { TranslationProvider } from "@/context/TranslationContext";
import TranslationForm from "@/components/TranslationForm";

const TranslationPage = () => {
    return (
        <TranslationProvider>
            {/* Wrap TranslationForm with TranslationProvider */}
            <TranslationForm />
        </TranslationProvider>
    );
};

export default TranslationPage;
