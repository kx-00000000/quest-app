"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldAlert, Zap, Lock, Eye } from "lucide-react";

export default function SafetyPage() {
    const router = useRouter();

    const sections = [
        {
            icon: Eye,
            title: "Safety First",
            desc: "移動中の画面操作は危険です。方位を確認する際は、必ず立ち止まり、周囲の安全を確認してください。"
        },
        {
            icon: Lock,
            title: "Private Areas",
            desc: "私有地、線路、立ち入り禁止区域には絶対に入らないでください。現地のルールと標識を常に優先してください。"
        },
        {
            icon: ShieldAlert,
            title: "Environment",
            desc: "夜間や悪天候時、不慣れな地形での探索は避けてください。自身の安全を最優先に考えた行動をお願いします。"
        }
    ];

    return (
        <div className="min-h-screen bg-white text-black p-8 font-sans pb-20">
            <button onClick={() => router.back()} className="pt-12 mb-8 text-gray-300 flex items-center gap-2">
                <ArrowLeft size={20} />
                <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
            </button>

            <header className="mb-12">
                <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none">Safety</h1>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">安全のためのガイドライン</p>
            </header>

            <div className="space-y-10">
                {sections.map((sec, idx) => (
                    <section key={idx} className="flex gap-6">
                        <div className="w-12 h-12 bg-pink-50 rounded-2xl flex items-center justify-center shrink-0">
                            <sec.icon className="text-pink-500" size={24} />
                        </div>
                        <div className="space-y-1.5 pt-1">
                            <h2 className="font-black uppercase text-sm tracking-tight">{sec.title}</h2>
                            <p className="text-[11px] text-gray-500 leading-relaxed font-bold">{sec.desc}</p>
                        </div>
                    </section>
                ))}
            </div>

            <div className="mt-20 space-y-4">
                <button
                    onClick={() => router.back()}
                    className="w-full py-5 bg-black text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] active:scale-95 transition-all shadow-xl"
                >
                    了解して戻る
                </button>
            </div>
        </div>
    );
}