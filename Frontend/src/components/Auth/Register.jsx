import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';

function Register() {
  const navigate = useNavigate();
  const [role, setRole] = useState('STUDENT');
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    department: '',
    rollNumber: '',
    semester: '',
    employeeCode: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const payload = {
        ...formData,
        role: role,
        semester: formData.semester ? parseInt(formData.semester) : null
      };

      await api.post('/auth/register', payload);
      // After successful register, redirect to login
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to register');
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '2rem auto' }}>
      <div className="card">
        <h2 className="text-center">Register</h2>
        {error && <div className="error-text text-center mb-4">{error}</div>}
        
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <button 
            type="button" 
            className={`btn ${role === 'STUDENT' ? 'btn-primary' : ''}`} 
            style={{ flex: 1, border: role !== 'STUDENT' ? '1px solid #ccc' : 'none' }}
            onClick={() => setRole('STUDENT')}
          >
            Student
          </button>
          <button 
            type="button" 
            className={`btn ${role === 'TEACHER' ? 'btn-primary' : ''}`}
            style={{ flex: 1, border: role !== 'TEACHER' ? '1px solid #ccc' : 'none' }}
            onClick={() => setRole('TEACHER')}
          >
            Teacher
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required />
          </div>
          
          <div className="form-group">
            <label>Username</label>
            <input type="text" name="username" value={formData.username} onChange={handleChange} required />
          </div>
          
          <div className="form-group">
            <label>Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required />
          </div>
          
          <div className="form-group">
            <label>Department</label>
            <input type="text" name="department" value={formData.department} onChange={handleChange} required />
          </div>

          {role === 'STUDENT' && (
            <>
              <div className="form-group">
                <label>Roll Number</label>
                <input type="text" name="rollNumber" value={formData.rollNumber} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Semester</label>
                <input type="number" name="semester" value={formData.semester} onChange={handleChange} required min="1" max="8" />
              </div>
            </>
          )}

          {role === 'TEACHER' && (
            <div className="form-group">
              <label>Employee Code</label>
              <input type="text" name="employeeCode" value={formData.employeeCode} onChange={handleChange} required />
            </div>
          )}
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
            Register
          </button>
        </form>
        
        <div className="text-center mt-4">
          <Link to="/login">Already have an account? Login</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
