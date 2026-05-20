import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

function Navbar() {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const token = localStorage.getItem('token');

  const handleLogout = async () => {
    try {
      if (token) {
        await api.post('/auth/logout');
      }
    } catch (err) {
      console.error('Logout failed on server, clearing local anyway', err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('userId');
      navigate('/login');
      window.location.reload();
    }
  };

  if (!role) return null;

  return (
    <nav style={{ 
      backgroundColor: '#1f2937', 
      color: 'white', 
      padding: '1rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    }}>
      <div>
        <h2 style={{ margin: 0, color: 'white', fontSize: '1.25rem' }}>
          Attendance System
        </h2>
      </div>
      
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Link 
          to={role === 'TEACHER' ? '/teacher' : '/student'} 
          style={{ color: '#e5e7eb', textDecoration: 'none', fontWeight: 500 }}
        >
          Dashboard
        </Link>
        <span style={{ color: '#9ca3af' }}>|</span>
        <button 
          onClick={handleLogout}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: '#ef4444', 
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: '1rem'
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
