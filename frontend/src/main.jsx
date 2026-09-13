import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Screener from './pages/Screener';
import Technical from './pages/Technical';
import Sentiment from './pages/Sentiment';
import Dcf from './pages/Dcf';
import ForwardLog from './pages/ForwardLog';
import './index.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/screener" element={<Screener />} />
        <Route path="/technical" element={<Technical />} />
        <Route path="/sentiment" element={<Sentiment />} />
        <Route path="/dcf" element={<Dcf />} />
        <Route path="/forward-log" element={<ForwardLog />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
