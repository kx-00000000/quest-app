"use client";

import { usePathname, useRouter } from "next/navigation";
import { Plus, Map, ScrollText, LayoutGrid, UserCircle } from "lucide-react";

export default function BottomNav() {
    const pathname = usePathname();
    const router = useRouter();

    // /adventure/id のページ（探索中）はナビを隠す
    if (pathname.includes("/adventure/") && pathname !== "/adventure/new") return null;

    const navItems = [
        { label: "NEW", path: "/adventure/new", icon: Plus },
        { label: "PLAN", path: "/plan", icon: Map },
        { label: "LOG", path: "/log", icon: ScrollText },
        { label: "ITEM", path: "/item", icon: LayoutGrid },
        { label: "MYPAGE", path: "/profile", icon: UserCircle },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-100 px-6 py-4 flex justify-between items-center z-[4000] pb-10">
            {navItems.map((item) => {
                const isActive = pathname === item.path;
                return (
                    <button
                        key={item.path}
                        onClick={() => router.push(item.path)}
                        className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${isActive ? 'text-black scale-110' : 'text-gray-300'
                            }`}
                    >
                        <item.icon size={22} strokeWidth={isActive ? 3 : 2} />
                        <span className={`text-[8px] font-black tracking-widest uppercase ${isActive ? 'opacity-100' : 'opacity-60'
                            }`}>
                            {item.label}
                        </span>
                        {isActive && (
                            <div className="absolute -bottom-1 w-1 h-1 bg-black rounded-full" />
                        )}
                    </button>
                );
            })}
        </nav>
    );
}