import React from 'react';
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
  );
}

export default App;
