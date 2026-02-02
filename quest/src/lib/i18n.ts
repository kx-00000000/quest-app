"use client";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "../locales/en.json";
import ja from "../locales/ja.json";

const resources = {
    en: {
        translation: en,
    },
    ja: {
        translation: ja,
    },
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: "ja", // Default to Japanese (Emotional) as requested primarily
        fallbackLng: "en",
        interpolation: {
            escapeValue: false, // react already safes from xss
        },
    });

export default i18n;
