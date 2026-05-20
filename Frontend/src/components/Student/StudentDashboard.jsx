import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../api/axios';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Html5QrcodeScanner } from 'html5-qrcode';

const COLORS = { PRESENT: '#22c55e', ABSENT: '#ef4444' };

function StudentDashboard() {
  const [profile, setProfile] = useState(null);
  const [summary, setSummary] = useState([]);
  const [history, setHistory] = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [scannerActive, setScannerActive] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview | courses | history
  const [enrolling, setEnrolling] = useState(null);
  const scannerRef = useRef(null);

  const fetchAll = useCallback(async () => {
    try {
      const [profileRes, summaryRes, historyRes, myCoursesRes, availRes] = await Promise.all([
        api.get('/student/profile'),
        api.get('/student/attendance/summary'),
        api.get('/student/attendance/history'),
        api.get('/student/courses'),
        api.get('/student/courses/available'),
      ]);
      setProfile(profileRes.data);
      setSummary(summaryRes.data);
      setHistory(historyRes.data);
      setMyCourses(myCoursesRes.data);
      setAvailableCourses(availRes.data);
    } catch (err) {
      console.error('Failed to load data', err);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    // Poll every 7 seconds so teacher modifications reflect immediately
    const interval = setInterval(fetchAll, 7000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  // Scanner lifecycle
  useEffect(() => {
    if (!scannerActive) return;

    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      { fps: 10, qrbox: { width: 280, height: 280 } },
      false
    );
    scannerRef.current = scanner;

    scanner.render(
      (decodedText) => {
        scanner.pause(true);
        scanner.clear().then(() => {
          scannerRef.current = null;
          setScannerActive(false);
          markAttendance(decodedText);
        }).catch(console.error);
      },
      () => {} // ignore frame errors
    );

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, [scannerActive]);

  const markAttendance = async (qrToken) => {
    setMessage({ type: '', text: '' });
    try {
      await api.post('/classroom/attendance/mark', { qrToken });
      setMessage({ type: 'success', text: '✅ Attendance marked successfully!' });
      fetchAll();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.error || '❌ Failed to mark attendance.',
      });
    }
  };

  const handleEnroll = async (courseId) => {
    setEnrolling(courseId);
    try {
      await api.post(`/student/courses/${courseId}/register`);
      setMessage({ type: 'success', text: '✅ Successfully enrolled!' });
      fetchAll();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || '❌ Enrollment failed.' });
    } finally {
      setEnrolling(null);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  // Chart data
  const totalClasses = summary.reduce((a, s) => a + s.totalClasses, 0);
  const totalAttended = summary.reduce((a, s) => a + s.attended, 0);
  const totalAbsent = totalClasses - totalAttended;
  const overallPct = totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 0;
  const chartData = [
    { name: 'Present', value: totalAttended },
    { name: 'Absent', value: totalAbsent },
  ];

  const pctColor = overallPct >= 75 ? '#22c55e' : overallPct >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-color)', padding: '0' }}>
      {/* Top Nav */}
      <nav style={{
        background: 'var(--card-bg)',
        borderBottom: '1px solid var(--border-color)',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary-color), #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 'bold', fontSize: '1.2rem'
          }}>
            {profile?.name?.charAt(0) || 'S'}
          </div>
          <div>
            <div style={{ fontWeight: 600 }}>{profile?.name || 'Student'}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Roll: {profile?.rollNumber} | Sem {profile?.semester} | {profile?.department}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <div style={{
            background: pctColor + '22', color: pctColor,
            padding: '0.25rem 0.75rem', borderRadius: '999px',
            fontWeight: 600, fontSize: '0.85rem'
          }}>
            {overallPct}% Attendance
          </div>
          <button onClick={handleLogout} className="btn" style={{
            background: 'var(--error-color)', color: 'white', padding: '0.4rem 1rem', fontSize: '0.85rem'
          }}>Logout</button>
        </div>
      </nav>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1rem' }}>

        {/* Message Banner */}
        {message.text && (
          <div style={{
            padding: '0.75rem 1rem',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem',
            background: message.type === 'error' ? '#ef444422' : '#22c55e22',
            color: message.type === 'error' ? '#ef4444' : '#22c55e',
            border: `1px solid ${message.type === 'error' ? '#ef4444' : '#22c55e'}44`,
            fontWeight: 500,
          }}>
            {message.text}
            <button onClick={() => setMessage({ type: '', text: '' })} style={{
              float: 'right', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit'
            }}>✕</button>
          </div>
        )}

        {/* Scan QR Section */}
        <div className="card" style={{
          marginBottom: '2rem',
          background: 'linear-gradient(135deg, var(--primary-color)11, var(--card-bg))',
          border: '2px solid var(--primary-color)44'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ margin: 0, color: 'var(--primary-color)' }}>📷 Mark Attendance</h2>
              <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Scan the QR code displayed by your teacher to mark yourself present.
              </p>
            </div>
            {!scannerActive ? (
              <button onClick={() => { setMessage({ type: '', text: '' }); setScannerActive(true); }}
                className="btn btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}>
                🔍 Scan QR Code
              </button>
            ) : (
              <button onClick={() => setScannerActive(false)}
                className="btn" style={{ background: '#ef4444', color: 'white', padding: '0.75rem 2rem' }}>
                ✕ Cancel
              </button>
            )}
          </div>
          {scannerActive && (
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
              <div id="qr-reader" style={{ width: '100%', maxWidth: 400 }} />
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0' }}>
          {[
            { key: 'overview', label: '📊 Overview' },
            { key: 'courses', label: '📚 Courses' },
            { key: 'history', label: '📋 History' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '0.75rem 1.25rem', fontWeight: 600, fontSize: '0.9rem',
              color: activeTab === tab.key ? 'var(--primary-color)' : 'var(--text-secondary)',
              borderBottom: activeTab === tab.key ? '2px solid var(--primary-color)' : '2px solid transparent',
              marginBottom: '-2px', transition: 'all 0.2s',
            }}>{tab.label}</button>
          ))}
        </div>

        {/* ========= OVERVIEW TAB ========= */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {/* Overall Pie Chart */}
            <div className="card" style={{ gridColumn: totalClasses > 0 ? 'auto' : '1 / -1' }}>
              <h3 style={{ marginTop: 0 }}>Overall Attendance</h3>
              {totalClasses > 0 ? (
                <>
                  <div style={{ height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                          paddingAngle={4} dataKey="value">
                          {chartData.map((entry, i) => (
                            <Cell key={i} fill={i === 0 ? COLORS.PRESENT : COLORS.ABSENT} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => [v, 'Classes']} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '1rem' }}>
                    <Stat label="Total" value={totalClasses} color="var(--text-color)" />
                    <Stat label="Present" value={totalAttended} color={COLORS.PRESENT} />
                    <Stat label="Absent" value={totalAbsent} color={COLORS.ABSENT} />
                  </div>
                </>
              ) : (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0' }}>
                  No classes conducted yet.
                </p>
              )}
            </div>

            {/* Course-wise Summary */}
            <div className="card" style={{ gridColumn: '1 / -1' }}>
              <h3 style={{ marginTop: 0 }}>Course-wise Breakdown</h3>
              {summary.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>No enrolled courses with sessions yet.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                        <th style={{ padding: '0.75rem' }}>Course</th>
                        <th style={{ padding: '0.75rem' }}>Total</th>
                        <th style={{ padding: '0.75rem' }}>Present</th>
                        <th style={{ padding: '0.75rem' }}>Absent</th>
                        <th style={{ padding: '0.75rem' }}>%</th>
                        <th style={{ padding: '0.75rem', minWidth: 120 }}>Progress</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.map((item, i) => {
                        const pct = item.percentage;
                        const clr = pct >= 75 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';
                        return (
                          <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '0.75rem', fontWeight: 500 }}>{item.courseId}</td>
                            <td style={{ padding: '0.75rem' }}>{item.totalClasses}</td>
                            <td style={{ padding: '0.75rem', color: '#22c55e' }}>{item.attended}</td>
                            <td style={{ padding: '0.75rem', color: '#ef4444' }}>{item.totalClasses - item.attended}</td>
                            <td style={{ padding: '0.75rem', fontWeight: 700, color: clr }}>{pct}%</td>
                            <td style={{ padding: '0.75rem' }}>
                              <div style={{ background: 'var(--border-color)', borderRadius: 999, height: 8 }}>
                                <div style={{ width: `${pct}%`, background: clr, height: 8, borderRadius: 999, transition: 'width 0.5s' }} />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========= COURSES TAB ========= */}
        {activeTab === 'courses' && (
          <div>
            <h3>My Enrolled Courses</h3>
            {myCourses.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>You are not enrolled in any courses yet.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                {myCourses.map(course => (
                  <CourseCard key={course.id} course={course} enrolled={true} />
                ))}
              </div>
            )}

            <h3>Available Courses</h3>
            {availableCourses.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No new courses to enroll in right now.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                {availableCourses.map(course => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    enrolled={false}
                    onEnroll={() => handleEnroll(course.id)}
                    enrolling={enrolling === course.id}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========= HISTORY TAB ========= */}
        {activeTab === 'history' && (
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Attendance History</h3>
            {history.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No attendance records found yet.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                      <th style={{ padding: '0.75rem' }}>Date</th>
                      <th style={{ padding: '0.75rem' }}>Course</th>
                      <th style={{ padding: '0.75rem' }}>Code</th>
                      <th style={{ padding: '0.75rem' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((rec, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.75rem' }}>
                          {new Date(rec.sessionDate).toLocaleString()}
                        </td>
                        <td style={{ padding: '0.75rem', fontWeight: 500 }}>{rec.courseName}</td>
                        <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{rec.courseCode}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '0.2rem 0.75rem',
                            borderRadius: 999,
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            background: rec.status === 'PRESENT' ? '#22c55e22' : '#ef444422',
                            color: rec.status === 'PRESENT' ? '#22c55e' : '#ef4444',
                          }}>
                            {rec.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '1.75rem', fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{label}</div>
    </div>
  );
}

function CourseCard({ course, enrolled, onEnroll, enrolling }) {
  return (
    <div className="card" style={{
      borderLeft: `4px solid ${enrolled ? '#22c55e' : 'var(--primary-color)'}`,
      padding: '1.25rem',
    }}>
      <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.35rem' }}>{course.courseName}</div>
      <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
        📌 {course.courseCode} | Sem {course.semester} | {course.department}
      </div>
      {enrolled ? (
        <span style={{ color: '#22c55e', fontSize: '0.8rem', fontWeight: 600 }}>✅ Enrolled</span>
      ) : (
        <button
          onClick={onEnroll}
          disabled={enrolling}
          className="btn btn-primary"
          style={{ width: '100%', padding: '0.5rem', fontSize: '0.85rem' }}>
          {enrolling ? 'Enrolling...' : '+ Enroll'}
        </button>
      )}
    </div>
  );
}

export default StudentDashboard;
