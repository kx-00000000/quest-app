"use client";

import { MOCK_PLANS } from "./mockData";

// --- データの構造定義 (Interfaces) ---

export interface Item {
    id: string;
    lat: number;
    lng: number;
    isCollected: boolean;
    name?: string;
    collectedAt?: string;
    collectedLocation?: string;
}

export interface Plan {
    id: string;
    name: string;
    radius: number;
    itemCount: number;
    status: string;
    createdAt: string;
    startedAt?: string;
    completedAt?: string;
    startLocation?: string;
    totalDistance: number;
    collectedCount: number;
    center?: { lat: number; lng: number };
    items?: Item[];
    path?: { lat: number; lng: number }[];
    isArchived?: boolean;
    finishedAt?: string;
    comment?: string; // コメント保存用に追加
}

const STORAGE_KEY = "quest_plans";

// --- 各機能の実装 ---

/**
 * 全てのプランを取得する
 * 1. windowが未定義(SSR時)はモックを返す
 * 2. データがなければモックを初期値として保存して返す
 * 3. 取得したデータは重複を排除して最新順を保つ
 */
export function getPlans(): Plan[] {
    if (typeof window === "undefined") return MOCK_PLANS;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
        // 初期状態としてモックデータを保存
        localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_PLANS));
        return MOCK_PLANS;
    }

    try {
        const parsed = JSON.parse(stored);
        // IDの重複を排除
        const unique = parsed.filter((plan: Plan, index: number, self: Plan[]) =>
            index === self.findIndex((t) => (
                t.id === plan.id
            ))
        );
        return unique;
    } catch (e) {
        console.error("Failed to parse plans", e);
        return MOCK_PLANS;
    }
}

/**
 * プランを保存する
 * IDが存在すれば更新、なければ配列の先頭に追加して保存
 */
export function savePlan(plan: Plan) {
    if (typeof window === "undefined") return;

    const plans = getPlans();
    const existingIndex = plans.findIndex(p => p.id === plan.id);

    let newPlans;
    if (existingIndex >= 0) {
        newPlans = [...plans];
        newPlans[existingIndex] = plan;
    } else {
        // 新しいプランは先頭に追加
        newPlans = [plan, ...plans];
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(newPlans));
}

/**
 * ★ AdventureView.tsx で使用：既存のプランを更新する
 * 既存の savePlan ロジックをそのまま活用します
 */
export const updatePlan = (plan: Plan) => {
    savePlan(plan);
};

/**
 * プランを削除（またはアーカイブ）する
 * 1. 冒険が開始されている(collectedCount > 0)か完了済みなら、削除せずアーカイブフラグを立てる
 * 2. まだ何もしていないプランであれば、物理的に削除する
 */
export function deletePlan(id: string) {
    if (typeof window === "undefined") return;

    const plans = getPlans();
    const target = plans.find(p => p.id === id);

    if (!target) return;

    let newPlans;

    // アーカイブ判定：収集済みのアイテムがある、またはステータスが完了の場合
    if (target.collectedCount > 0 || target.status === 'completed' || target.items?.some(i => i.isCollected)) {
        const updated = { ...target, isArchived: true };
        newPlans = plans.map(p => p.id === id ? updated : p);
    } else {
        // 手付かずのプランは完全に削除
        newPlans = plans.filter(p => p.id !== id);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(newPlans));
}