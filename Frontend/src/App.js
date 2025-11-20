import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import StudentRegister from './pages/StudentRegister';
import VendorRegister from './pages/VendorRegister';
import StudentDashboard from './pages/StudentDashboard';
import VendorDashboard from './pages/VendorDashboard';
import PleaseVerify from './pages/PleaseVerify';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <div className="App">
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register/student" element={<StudentRegister />} />
              <Route path="/register/vendor" element={<VendorRegister />} />
              <Route path="/please-verify" element={<PleaseVerify />} />
              <Route
                path="/dashboard/student"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/vendor"
                element={
                  <ProtectedRoute allowedRoles={['vendor']}>
                    <VendorDashboard />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;