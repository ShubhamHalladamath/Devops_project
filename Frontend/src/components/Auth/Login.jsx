import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = 'device-' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('deviceId', deviceId);
    }

    try {
      const response = await api.post('/auth/login', {
        username: formData.username.trim(),
        password: formData.password,
        deviceId,
      });
      const { token, role, userId } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('userId', userId);
      navigate(role === 'TEACHER' ? '/teacher' : '/student');
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
    }}>
      <div className="animate-slide" style={{ width: '100%', maxWidth: 420 }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(135deg, var(--accent), #a78bfa)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', marginBottom: '1rem',
            boxShadow: '0 8px 32px var(--accent-glow)',
          }}>
            📋
          </div>
          <h1 style={{ marginBottom: '0.25rem', fontSize: '1.6rem' }}>QR Attend</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Sign in to your account
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '2rem' }}>
          {error && (
            <div style={{
              padding: '0.65rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--error-bg)',
              color: 'var(--error)',
              border: '1px solid rgba(248,113,113,0.2)',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                name="username"
                placeholder="Enter your username"
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
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}>
              {loading ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{
                    width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff', borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite', display: 'inline-block'
                  }} />
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <div style={{
            textAlign: 'center', marginTop: '1.5rem', paddingTop: '1.25rem',
            borderTop: '1px solid var(--border)',
          }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Don't have an account?{' '}
            </span>
            <Link to="/register" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
              Create Account
            </Link>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default Login;
