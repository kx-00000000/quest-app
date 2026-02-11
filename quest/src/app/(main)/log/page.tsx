"use client";

import { useEffect, useState } from "react";
import { getPlans } from "@/lib/storage";
import { Map, Clock, Package, MessageSquare, ChevronRight, Calendar } from "lucide-react";

export default function LogPage() {
    const [logs, setLogs] = useState<any[]>([]);

    useEffect(() => {
        // 保存されているプランから「完了済み」のものだけを抽出
        const allPlans = getPlans();
        const completed = allPlans
            .filter((p: any) => p.status === "completed")
            .sort((a: any, b: any) => new Date(b.finishedAt).getTime() - new Date(a.finishedAt).getTime());
        setLogs(completed);
    }, []);

    return (
        <div className="min-h-screen bg-white text-black font-sans pb-32">
            {/* 1. Global Stats: 航跡の総計 */}
            <header className="p-8 pt-16 border-b border-gray-100">
                <h1 className="text-2xl font-bold tracking-tighter uppercase mb-6">Flight Log</h1>
                <div className="flex gap-12">
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Quests</p>
                        <p className="text-3xl font-bold tabular-nums">{logs.length}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Items Found</p>
                        <p className="text-3xl font-bold tabular-nums">
                            {logs.reduce((acc, curr) => acc + (curr.collectedCount || 0), 0)}
                        </p>
                    </div>
                </div>
            </header>

            {/* 2. Log List: 冒険の記憶 */}
            <main className="p-4 space-y-4">
                {logs.length > 0 ? (
                    logs.map((log) => (
                        <div key={log.id} className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="space-y-1">
                                    <h3 className="text-lg font-bold leading-tight uppercase tracking-tight">{log.name}</h3>
                                    <p className="text-[10px] font-medium text-gray-400 flex items-center gap-1">
                                        <Calendar size={12} /> {new Date(log.finishedAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="bg-gray-50 px-3 py-1 rounded-full text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                    Success
                                </div>
                            </div>

                            {/* 冒険のサマリー情報 */}
                            <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-gray-50">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-black">
                                        <Package size={16} />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase leading-none">Collected</p>
                                        <p className="text-sm font-bold">{log.collectedCount} Items</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-black">
                                        <Clock size={16} />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase leading-none">Status</p>
                                        <p className="text-sm font-bold uppercase">Archived</p>
                                    </div>
                                </div>
                            </div>

                            {/* ユーザーコメント */}
                            {log.comment && (
                                <div className="mt-4 flex gap-3 items-start bg-gray-50/50 p-3 rounded-xl">
                                    <MessageSquare size={14} className="text-gray-300 mt-1 shrink-0" />
                                    <p className="text-xs font-medium text-gray-600 leading-relaxed italic">
                                        "{log.comment}"
                                    </p>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="py-20 text-center space-y-4">
                        <Map size={48} className="mx-auto text-gray-100" />
                        <p className="text-sm font-bold text-gray-300 uppercase tracking-widest">No logs recorded yet.</p>
                    </div>
                )}
            </main>
        </div>
    );
}