"use client";

import { usePathname, useRouter } from "next/navigation";
import { Plus, Map, ScrollText, LayoutGrid, UserCircle } from "lucide-react";

export default function BottomNav() {
    const pathname = usePathname();
    const router = useRouter();

    // 探索中の画面（/adventure/[id]）ではナビゲーションを隠す
    if (pathname.includes("/adventure/") && pathname !== "/adventure/new") return null;

    const navItems = [
        // ★ パスを /new に修正。もしトップページが作成画面なら "/" に書き換えてください
        { label: "NEW", path: "/new", icon: Plus },
        { label: "PLAN", path: "/plan", icon: Map },
        { label: "LOG", path: "/log", icon: ScrollText },
        { label: "ITEM", path: "/item", icon: LayoutGrid },
        { label: "MYPAGE", path: "/profile", icon: UserCircle },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-100 z-[4000] pb-10">
            {/* grid-cols-5 で全アイコンを数学的に等間隔に配置 */}
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
                                // 線を極細 (1.2) に変更して繊細な印象に
                                strokeWidth={isActive ? 1.8 : 1.2}
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