import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";

import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Dashboard from "@/pages/Dashboard";
import ResumeAnalyze from "@/pages/ResumeAnalyze";
import ResumeRewriter from "@/pages/ResumeRewriter";
import SkillsRoleFit from "@/pages/SkillsRoleFit";
import Jobs from "@/pages/Jobs";
import Profile from "@/pages/Profile";

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 font-display text-2xl">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="App">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
            <Route path="/resume" element={<Protected><ResumeAnalyze /></Protected>} />
            <Route path="/rewriter" element={<Protected><ResumeRewriter /></Protected>} />
            <Route path="/skills" element={<Protected><SkillsRoleFit /></Protected>} />
            <Route path="/jobs" element={<Protected><Jobs /></Protected>} />
            <Route path="/profile" element={<Protected><Profile /></Protected>} />
          </Routes>
          <Toaster position="top-right" />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
