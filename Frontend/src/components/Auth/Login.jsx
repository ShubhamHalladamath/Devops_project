import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Ensure deviceId exists
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = 'device-' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('deviceId', deviceId);
    }

    try {
      const response = await api.post('/auth/login', {
        username: formData.username.trim(),
        password: formData.password,
        deviceId: deviceId
      });
      
      const { token, role, userId } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('userId', userId);
      
      if (role === 'TEACHER') {
        navigate('/teacher');
      } else {
        navigate('/student');
      }
      
      window.location.reload(); // Quick way to trigger React Router's new state
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to login');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '4rem auto' }}>
      <div className="card">
        <h2 className="text-center">Login</h2>
        {error && <div className="error-text text-center mb-4">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input 
              type="text" 
              name="username" 
              value={formData.username} 
              onChange={handleChange} 
              required 
              autoCapitalize="none"
              autoCorrect="off"
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              name="password" 
              value={formData.password} 
              onChange={handleChange} 
              required 
            />
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
            Login
          </button>
        </form>
        
        <div className="text-center mt-4">
          <Link to="/register">Don't have an account? Register</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
