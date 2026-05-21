import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import TeacherDashboard from './components/Teacher/TeacherDashboard';
import StudentDashboard from './components/Student/StudentDashboard';

function App() {
  const role = localStorage.getItem('role');

  const ProtectedRoute = ({ children, allowedRole }) => {
    if (!role) return <Navigate to="/login" replace />;
    if (allowedRole && role !== allowedRole) return <Navigate to="/" replace />;
    return children;
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!role ? <Login /> : <Navigate to="/" />} />
        <Route path="/register" element={!role ? <Register /> : <Navigate to="/" />} />

        <Route path="/teacher/*" element={
          <ProtectedRoute allowedRole="TEACHER">
            <TeacherDashboard />
          </ProtectedRoute>
        } />

        <Route path="/student/*" element={
          <ProtectedRoute allowedRole="STUDENT">
            <StudentDashboard />
          </ProtectedRoute>
        } />

        <Route path="/" element={
          role === 'TEACHER' ? <Navigate to="/teacher" /> :
          role === 'STUDENT' ? <Navigate to="/student" /> :
          <Navigate to="/login" />
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
