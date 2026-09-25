import React from 'react';
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
  );
}

export default App;
