import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Plan from './pages/Plan';
import Payment from './pages/Payment';
import ResumeSetup from './pages/ResumeSetup';

import {
  Registration,
  Login,
  VerifyEmail,
  ForgotPassword,
  CheckInbox,
  ResetPassword,
  PasswordUpdated,
} from './pages/onboarding';
import Dashboard from './pages/Dashboard';
import BrowseJobs from './pages/BrowseJobs';
import AutoApply from './pages/AutoApply'; 
import Tracker from './pages/Tracker';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import UpgradePlan from './pages/UpgradePlan';
import Home from "./pages/Home";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Registration />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/check-inbox" element={<CheckInbox />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/password-updated" element={<PasswordUpdated />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/Dashboard" element={<Dashboard />} />
        <Route path="/browse-jobs" element={<BrowseJobs />} />
        <Route path="/auto-apply" element={<AutoApply />} />
        <Route path="/tracker" element={<Tracker />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/upgrade-plan" element={<UpgradePlan />} />
        <Route path="/upgrade" element={<UpgradePlan />} />
        <Route path="/plan" element={<Plan />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/resume-setup" element={<ResumeSetup />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

