import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { BottomDock } from './components/BottomDock';
import { MiniPlayerPill } from './components/MiniPlayerPill';
import { HomePage } from './pages/HomePage';
import { WatchRoomPage } from './pages/WatchRoomPage';
import { SchedulePage } from './pages/SchedulePage';
import { FavoritesPage } from './pages/FavoritesPage';

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <div
          className="min-h-screen bg-[#0b0c0e] text-stone-200 flex flex-col pb-20 md:pb-8 antialiased selection:bg-emerald-500/30 selection:text-white"
          dir="rtl"
        >
          {/* Desktop Sticky Header */}
          <Navbar />

          {/* Main Viewport Container */}
          <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6">
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

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          </main>

          {/* Persistent Floating Mini-Player Pill */}
          <MiniPlayerPill />

          {/* Mobile Tactile Bottom Dock */}
          <BottomDock />
        </div>
      </AppProvider>
    </BrowserRouter>
  );
}
