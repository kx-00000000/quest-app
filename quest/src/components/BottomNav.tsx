"use client";

import { usePathname, useRouter } from "next/navigation";
import { Plus, Map, ScrollText, LayoutGrid, UserCircle } from "lucide-react";

export default function BottomNav() {
    const pathname = usePathname();
    const router = useRouter();

    // 探索画面（/adventure/[id]）ではナビゲーションを非表示にする
    if (pathname.includes("/adventure/") && pathname !== "/adventure/new") return null;

    const navItems = [
        { label: "NEW", path: "/quest/new", icon: Plus },
        { label: "PLAN", path: "/plan", icon: Map },
        { label: "LOG", path: "/log", icon: ScrollText },
        { label: "ITEM", path: "/item", icon: LayoutGrid },
        { label: "MYPAGE", path: "/profile", icon: UserCircle },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-100 z-[4000] pb-10">
            {/* grid-cols-5 を使用して数学的に等間隔な配置を実現 */}
            <div className="grid grid-cols-5 w-full h-16">
                {navItems.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                        <button
                            key={item.path}
                            onClick={() => router.push(item.path)}
                            className="flex flex-col items-center justify-center gap-1 transition-all duration-300 active:scale-90"
                        >
                            <item.icon
                                size={22}
                                // 線をさらに細く (1.5) 設定してミニマルな印象に
                                strokeWidth={isActive ? 2 : 1.5}
                                className={isActive ? "text-black" : "text-gray-300"}
                            />
                            <span className={`text-[7px] font-black tracking-[0.2em] uppercase transition-colors ${isActive ? "text-black" : "text-gray-300"
                                }`}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}