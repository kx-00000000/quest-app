"use client";

import { MOCK_PLANS } from "./mockData";

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
}

const STORAGE_KEY = "quest_plans";

export function getPlans(): Plan[] {
    if (typeof window === "undefined") return MOCK_PLANS;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
        // Initialize with mock data
        localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_PLANS));
        return MOCK_PLANS;
    }

    try {
        const parsed = JSON.parse(stored);
        // Deduplicate: Keep the first occurrence (most recent if prepended)
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

export function savePlan(plan: Plan) {
    const plans = getPlans();
    const existingIndex = plans.findIndex(p => p.id === plan.id);

    let newPlans;
    if (existingIndex >= 0) {
        newPlans = [...plans];
        newPlans[existingIndex] = plan;
    } else {
        newPlans = [plan, ...plans];
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(newPlans));
}

export function deletePlan(id: string) {
    const plans = getPlans();
    const target = plans.find(p => p.id === id);

    if (!target) return;

    let newPlans;

    // If plan has started (collected items > 0) or is completed, archive it instead of deleting
    if (target.collectedCount > 0 || target.status === 'completed') {
        const updated = { ...target, isArchived: true };
        newPlans = plans.map(p => p.id === id ? updated : p);
    } else {
        // If it's a fresh/ready plan with no data, actually delete it
        newPlans = plans.filter(p => p.id !== id);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(newPlans));
}
