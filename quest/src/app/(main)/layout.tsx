
import BottomNav from "@/components/BottomNav";

export default function MainLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <main className="max-w-md mx-auto min-h-screen bg-white shadow-sm relative">
                {children}
            </main>
            <BottomNav />
        </div>
    );
}
