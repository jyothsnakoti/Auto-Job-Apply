import React from 'react';
<<<<<<< HEAD
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Plan from './pages/Plan';
import Payment from './pages/Payment';
import ResumeSetup from './pages/ResumeSetup';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/plan" element={<Plan />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/resume-setup" element={<ResumeSetup />} />
      </Routes>
    </Router>
=======
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import {
  Registration,
  Login,
  VerifyEmail,
  ForgotPassword,
  CheckInbox,
  ResetPassword,
  PasswordUpdated,
} from './pages/onboarding';
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
      </Routes>
    </BrowserRouter>
>>>>>>> 9c0c3b32ca1fb63767021a5e26b3bb3b5d5cbf3a
  );
}

export default App;
