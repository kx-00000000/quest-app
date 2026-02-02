import React from 'react';

interface SectionProps {
    title: string;
    children: React.ReactNode;
    className?: string;
    action?: React.ReactNode;
}

export function Section({ title, children, className = '', action }: SectionProps) {
    return (
        <section className={`mb-4 overflow-hidden bg-white/80 p-4 shadow-sm backdrop-blur-sm ${className}`}>
            <div className="mb-3 flex items-center justify-between border-b border-ink/10 pb-2">
                <h2 className="font-sans text-sm font-bold tracking-wider text-ink/70 uppercase">
                    {title}
                </h2>
                {action}
            </div>
            <div className="space-y-3">
                {children}
            </div>
        </section>
    );
}
