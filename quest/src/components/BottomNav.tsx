"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, Map, History, Box } from "lucide-react"; // Icons for tabs
import { useTranslation } from "react-i18next";
import "@/lib/i18n"; // Ensure i18n is initialized

export default function BottomNav() {
    const pathname = usePathname();
    const { t } = useTranslation();

    const tabs = [
        { name: t("tab_new"), href: "/new", icon: Plus },
        { name: t("tab_plan"), href: "/plan", icon: Map },
        { name: t("tab_log"), href: "/log", icon: History },
        { name: t("tab_item"), href: "/item", icon: Box }, // "Item" collection
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe pt-2 px-6 z-50">
            <div className="flex justify-between items-center max-w-md mx-auto">
                {tabs.map((tab) => {
                    const isActive = pathname.startsWith(tab.href);
                    const Icon = tab.icon;

                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={`flex flex-col items-center justify-center w-16 py-2 transition-colors ${isActive
                                    ? "text-quest-green-600 font-bold"
                                    : "text-gray-400 hover:text-gray-600"
                                }`}
                        >
                            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                            <span className="text-[10px] mt-1 tracking-wide">{tab.name}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
