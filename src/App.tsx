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
import { FavoritesPage } from './pages/FavoritesPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';
import { DmcaPage } from './pages/DmcaPage';

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <div
          className="min-h-screen theme-canvas flex flex-col pb-20 md:pb-0 antialiased selection:bg-emerald-500/30 selection:text-white transition-colors duration-300"
          dir="rtl"
        >
          {/* Desktop Sticky Header */}
          <Navbar />

          {/* Main Viewport Container (Wide 1440px / max-w-7xl) */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
            <Routes>
              {/* Default Redirect to /home */}
              <Route path="/" element={<Navigate to="/home" replace />} />

              {/* /home (Channel Directory) */}
              <Route path="/home" element={<HomePage />} />

              {/* /watchroom & /watchroom/:channelId (Watch Theater) */}
              <Route path="/watchroom" element={<WatchRoomPage />} />
              <Route path="/watchroom/:channelId" element={<WatchRoomPage />} />

              {/* /schedual (Live Fixtures) */}
              <Route path="/schedual" element={<SchedulePage />} />
              <Route path="/schedule" element={<Navigate to="/schedual" replace />} />

              {/* /favorit (User Favorites) */}
              <Route path="/favorit" element={<FavoritesPage />} />
              <Route path="/favorites" element={<Navigate to="/favorit" replace />} />

              {/* Essential Legal & Policy Pages */}
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/dmca" element={<DmcaPage />} />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          </main>

          {/* Website Footer */}
          <Footer />

          {/* Persistent Floating Mini-Player Pill */}
          <MiniPlayerPill />

          {/* Mobile Tactile Bottom Dock */}
          <BottomDock />
        </div>
      </AppProvider>
    </BrowserRouter>
  );
}
