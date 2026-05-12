import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Shell from "./components/Shell.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import CheckIn from "./pages/CheckIn.jsx";
import HighFives from "./pages/HighFives.jsx";
import OneOnOnes from "./pages/OneOnOnes.jsx";
import OKRs from "./pages/OKRs.jsx";
import OpenMic from "./pages/OpenMic.jsx";
import VibeReport from "./pages/VibeReport.jsx";
import RequestFeedback from "./pages/RequestFeedback.jsx";
import Settings from "./pages/Settings.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/check-in" element={<CheckIn />} />
        <Route path="/high-fives" element={<HighFives />} />
        <Route path="/one-on-ones" element={<OneOnOnes />} />
        <Route path="/okrs" element={<OKRs />} />
        <Route path="/open-mic" element={<OpenMic />} />
        <Route path="/vibe-report" element={<VibeReport />} />
        <Route path="/request-feedback" element={<RequestFeedback />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
