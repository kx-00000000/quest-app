'use client';

import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [show, setShow] = useState(false);

    useEffect(() => {
        // Listen for the 'beforeinstallprompt' event
        const handler = (e: any) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Update UI notify the user they can install the PWA
            setShow(true);
            console.log("PWA Install Prompt ready");
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;

        console.log(`User response to the install prompt: ${outcome}`);

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
        setShow(false);
    };

    const handleDismiss = () => {
        setShow(false);
    }

    if (!show) return null;

    return (
        <div className="fixed bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom duration-500">
            <div className="flex items-center justify-between gap-3 bg-[#FFFDF5] p-4 border-2 border-black shadow-retro">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center border-2 border-black bg-[#FF9EAA] text-black shadow-[2px_2px_0_#000]">
                        <Download size={20} />
                    </div>
                    <div>
                        <div className="text-sm font-heading tracking-wide text-ink">Install App</div>
                        <div className="text-[10px] text-ink/60 font-mono">Add to home screen for better experience</div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleDismiss}
                        className="px-2 py-1 text-xs font-bold font-mono text-ink/40 hover:text-ink hover:underline"
                    >
                        LATER
                    </button>
                    <button
                        onClick={handleInstall}
                        className="bg-[#B0E57C] border-2 border-black px-3 py-1.5 text-xs font-bold text-black shadow-retro-sm hover:translate-y-px hover:shadow-none"
                    >
                        INSTALL
                    </button>
                </div>
            </div>
        </div>
    );
}
