import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import BrowseJobs from './pages/BrowseJobs';
import AutoApply from './pages/AutoApply';
import Tracker from './pages/Tracker';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import UpgradePlan from './pages/UpgradePlan';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <div style={{ minHeight: '100vh', backgroundColor: '#FFFFFF' }}>
              <Navbar />
            </div>
          }
        />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/Dashboard" element={<Dashboard />} />
        <Route path="/browse-jobs" element={<BrowseJobs />} />
        <Route path="/auto-apply" element={<AutoApply />} />
        <Route path="/tracker" element={<Tracker />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/upgrade-plan" element={<UpgradePlan />} />
        <Route path="/upgrade" element={<UpgradePlan />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

