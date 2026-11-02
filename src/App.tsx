import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { BottomDock } from './components/BottomDock';
import { MiniPlayerPill } from './components/MiniPlayerPill';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { WatchRoomPage } from './pages/WatchRoomPage';
import { SchedulePage } from './pages/SchedulePage';
import { LeaguesPage } from './pages/LeaguesPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';
import { DmcaPage } from './pages/DmcaPage';

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <div
          className="min-h-screen theme-canvas flex flex-col pb-16 md:pb-0 antialiased selection:bg-[#c8f526] selection:text-[#0a0f0c]"
          dir="rtl"
        >
          {/* Broadcast Top Control Bar */}
          <Navbar />

          {/* Main Broadcast Viewport Container */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
            <Routes>
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/home" element={<HomePage />} />
              <Route path="/watchroom" element={<WatchRoomPage />} />
              <Route path="/watchroom/:channelId" element={<WatchRoomPage />} />
              <Route path="/schedual" element={<SchedulePage />} />
              <Route path="/schedule" element={<Navigate to="/schedual" replace />} />
              <Route path="/leagues" element={<LeaguesPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/dmca" element={<DmcaPage />} />
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          </main>

          <Footer />
          <MiniPlayerPill />
          <BottomDock />
        </div>
      </AppProvider>
    </BrowserRouter>
  );
}
