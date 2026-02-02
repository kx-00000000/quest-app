'use client';

import { useState, useEffect, useRef } from 'react';
import { useGameLogic } from '@/hooks/useGameLogic';
import { Item, Letter } from '@/types';
import { MapPin, Send, Mail, Briefcase, Plus } from 'lucide-react';
import { InstallPrompt } from '@/components/InstallPrompt';

import { HomeTab } from '@/components/HomeTab';
import { CreateTab } from '@/components/CreateTab';
import { LettersTab } from '@/components/LettersTab';
import { ItemsTab } from '@/components/ItemsTab';
import { LetterDetail } from '@/components/LetterDetail';

import { ItemDetail } from '@/components/ItemDetail';

// Minimalist Header
function Header() {
  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-sm border-b border-black text-center py-4">
      <h1 className="text-xl font-bold tracking-[0.2em] uppercase">Paper Airplanes</h1>
    </header>
  );
}

export default function Home() {
  const {
    myItems,
    myLetters,
    nearbyItems,
    nearbyLetters,
    dropItem,
    pickItem,
    dropLetter,
    collectLetter,
    userLocation,
    getDistanceFromUser,
    updateLetterMessage,
    userId // Round 12
  } = useGameLogic();

  const [activeTab, setActiveTab] = useState<'home' | 'create' | 'letters' | 'items'>('home');

  // Modals
  const [viewingLetter, setViewingLetter] = useState<Letter | null>(null);
  const [viewingItem, setViewingItem] = useState<Item | null>(null);

  // Notification Logic (Keeping existing)
  const prevNearbyCount = useRef(0);
  useEffect(() => {
    const totalNearby = nearbyItems.length + nearbyLetters.length;
    if (totalNearby > prevNearbyCount.current && totalNearby > 0) {
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        try {
          new Notification('Nearby Discovery!', { body: 'Something is hidden nearby...', icon: '/icons/icon-192x192.png' });
        } catch (e) { console.error(e); }
      }
    }
    prevNearbyCount.current = totalNearby;
  }, [nearbyItems.length, nearbyLetters.length]);

  return (
    <main className="h-screen flex flex-col bg-white text-black font-sans md:mx-auto md:max-w-md shadow-2xl overflow-hidden relative">
      <InstallPrompt />
      <Header />

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'home' && (
          <HomeTab
            userLocation={userLocation}
            nearbyItems={nearbyItems}
            nearbyLetters={nearbyLetters}
            onInteractItem={async (item) => {
              // Open ItemDetail for preview
              setViewingItem(item);
            }}
            onInteractLetter={async (letter) => {
              // Now we just OPEN it for preview. Collection happens in LetterDetail via 'onCollect'.
              setViewingLetter(letter);
            }}
            getDistance={getDistanceFromUser}
          />
        )}
        {activeTab === 'create' && (
          <CreateTab
            userLocation={userLocation}
            userId={userId} // Pass userId
            onDrop={(content, color, angle, dist, senderName, recipientId) => { // Round 12
              dropLetter(content, color, angle, dist, senderName, recipientId);
              setActiveTab('home');
            }}
          />
        )}
        {activeTab === 'letters' && (
          <LettersTab
            letters={myLetters}
            onSelect={(l) => setViewingLetter(l)}
          />
        )}
        {activeTab === 'items' && (
          <ItemsTab
            items={myItems}
            onSelect={(i) => setViewingItem(i)}
            currentUserId={userId} // Round 12: Pass ID
          />
        )}
      </div>

      {/* Bottom Nav */}
      <nav className="border-t border-black bg-white pb-safe">
        <div className="flex justify-around items-center h-16">
          <NavButton active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={<MapPin />} label="HOME" />
          <NavButton active={activeTab === 'create'} onClick={() => setActiveTab('create')} icon={<Send />} label="CREATE" />
          <NavButton active={activeTab === 'letters'} onClick={() => setActiveTab('letters')} icon={<Mail />} label="LETTERS" />
          <NavButton active={activeTab === 'items'} onClick={() => setActiveTab('items')} icon={<Briefcase />} label="ITEMS" />
        </div>
      </nav>

      {/* Modals */}
      {viewingLetter && (
        <LetterDetail
          letter={viewingLetter}
          onClose={() => setViewingLetter(null)}
          onCollect={
            // Only pass onCollect if it's NOT mine and NOT collected yet (status check or simply check if in myLetters?)
            // Actually `onInteractLetter` is for `nearbyLetters` (uncollected).
            // `LettersTab` is form `myLetters` (collected).
            // So we can check if the letter is in `nearbyLetters`.
            nearbyLetters.some(l => l.id === viewingLetter.id)
              ? async () => {
                await collectLetter(viewingLetter.id);
                setViewingLetter(null);
                setActiveTab('letters'); // Go to collection? Or stay? Maybe stay. Spec says "Save to box".
              }
              : undefined
          }
          onUpdateMessage={(id, msg) => {
            updateLetterMessage(id, msg);
          }}
          currentUserId="me"
        />
      )}

      {/* Item Detail Modal */}
      {viewingItem && (
        <ItemDetail
          item={viewingItem}
          onClose={() => setViewingItem(null)}
          onCollect={
            // Same logic as letters: if nearby, show Keep/Leave
            nearbyItems.some(i => i.id === viewingItem.id)
              ? async () => {
                return await pickItem(viewingItem.id);
              }
              : undefined
          }
          // If NOT nearby (meaning we own it), allow discard
          onDiscard={
            !nearbyItems.some(i => i.id === viewingItem.id)
              ? async () => {
                await dropItem(viewingItem.id);
                setActiveTab('items'); // Refresh list (logic handles state update)
              }
              : undefined
          }
        />
      )}

    </main>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center w-full h-full transition-all ${active ? 'opacity-100' : 'opacity-30 hover:opacity-60'}`}>
      <div className={`mb-1 ${active ? 'scale-110' : 'scale-100'}`}>
        {icon}
      </div>
      <span className="text-[10px] font-bold tracking-widest">{label}</span>
      {active && <div className="w-1 h-1 bg-black rounded-full mt-1"></div>}
    </button>
  );
}
