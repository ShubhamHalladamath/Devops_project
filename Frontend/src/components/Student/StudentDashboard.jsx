import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../api/axios';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Html5QrcodeScanner } from 'html5-qrcode';

function StudentDashboard() {
  const [profile, setProfile] = useState(null);
  const [summary, setSummary] = useState([]);
  const [history, setHistory] = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [scannerActive, setScannerActive] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
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
    const interval = setInterval(fetchAll, 7000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  useEffect(() => {
    if (!scannerActive) return;
    const scanner = new Html5QrcodeScanner(
      'qr-reader', { fps: 10, qrbox: { width: 280, height: 280 } }, false
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
      () => {}
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
      setMessage({ type: 'error', text: err.response?.data?.error || '❌ Failed to mark attendance.' });
    }
  };

  const handleEnroll = async (courseId) => {
    setEnrolling(courseId);
    try {
      await api.post(`/student/courses/${courseId}/register`);
      setMessage({ type: 'success', text: '✅ Enrolled successfully!' });
      fetchAll();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || '❌ Enrollment failed.' });
    } finally {
      setEnrolling(null);
    }
  };

  const handleLogout = () => { localStorage.clear(); window.location.href = '/'; };

  const totalClasses = summary.reduce((a, s) => a + s.totalClasses, 0);
  const totalAttended = summary.reduce((a, s) => a + s.attended, 0);
  const totalAbsent = totalClasses - totalAttended;
  const overallPct = totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 0;
  const chartData = [
    { name: 'Present', value: totalAttended },
    { name: 'Absent', value: totalAbsent },
  ];
  const pctColor = overallPct >= 75 ? 'var(--success)' : overallPct >= 50 ? 'var(--warning)' : 'var(--error)';

  const tabs = [
    { key: 'overview', label: '📊 Overview' },
    { key: 'courses', label: '📚 Courses' },
    { key: 'history', label: '📋 History' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* ─── Navbar ─── */}
      <nav style={{
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        padding: '0.75rem 1.5rem', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', position: 'sticky', top: 0, zIndex: 100,
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, var(--accent), #a78bfa)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: '0.9rem',
            boxShadow: '0 2px 8px var(--accent-glow)',
          }}>
            {profile?.name?.charAt(0) || 'S'}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{profile?.name || 'Student'}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {profile?.rollNumber} · Sem {profile?.semester} · {profile?.department}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <div style={{
            background: pctColor === 'var(--success)' ? 'var(--success-bg)' :
                        pctColor === 'var(--warning)' ? 'var(--warning-bg)' : 'var(--error-bg)',
            color: pctColor,
            padding: '0.2rem 0.7rem', borderRadius: 999,
            fontWeight: 700, fontSize: '0.8rem',
            border: `1px solid ${pctColor}33`,
          }}>
            {overallPct}%
          </div>
          <button onClick={handleLogout} className="btn btn-danger"
            style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem' }}>
            Logout
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.5rem 1rem' }}>

        {/* ─── Message ─── */}
        {message.text && (
          <div className="animate-in" style={{
            padding: '0.7rem 1rem', borderRadius: 'var(--radius-md)',
            marginBottom: '1.25rem', fontSize: '0.875rem', fontWeight: 500,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: message.type === 'error' ? 'var(--error-bg)' : 'var(--success-bg)',
            color: message.type === 'error' ? 'var(--error)' : 'var(--success)',
            border: `1px solid ${message.type === 'error' ? 'rgba(248,113,113,0.2)' : 'rgba(52,211,153,0.2)'}`,
          }}>
            <span>{message.text}</span>
            <button onClick={() => setMessage({ type: '', text: '' })} style={{
              background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: '1rem'
            }}>✕</button>
          </div>
        )}

        {/* ─── Scanner ─── */}
        <div className="card" style={{
          marginBottom: '1.5rem',
          background: 'linear-gradient(135deg, var(--accent-subtle), var(--surface))',
          border: '1px solid var(--accent)33',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem' }}>📷 Mark Attendance</h2>
              <p style={{ margin: '0.2rem 0 0', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                Scan the QR code shown by your teacher
              </p>
            </div>
            {!scannerActive ? (
              <button onClick={() => { setMessage({ type: '', text: '' }); setScannerActive(true); }}
                className="btn btn-primary" style={{ padding: '0.6rem 1.5rem' }}>
                🔍 Scan QR
              </button>
            ) : (
              <button onClick={() => setScannerActive(false)} className="btn btn-danger"
                style={{ padding: '0.6rem 1.5rem' }}>
                ✕ Cancel
              </button>
            )}
          </div>
          {scannerActive && (
            <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'center' }}>
              <div id="qr-reader" style={{ width: '100%', maxWidth: 380 }} />
            </div>
          )}
        </div>

        {/* ─── Tabs ─── */}
        <div style={{
          display: 'flex', gap: '0.25rem', marginBottom: '1.5rem',
          background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)',
          padding: '0.3rem',
        }}>
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              flex: 1, padding: '0.6rem', borderRadius: 'var(--radius-sm)',
              border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              fontWeight: 600, fontSize: '0.85rem',
              background: activeTab === tab.key ? 'var(--surface)' : 'transparent',
              color: activeTab === tab.key ? 'var(--accent)' : 'var(--text-muted)',
              boxShadow: activeTab === tab.key ? 'var(--shadow-sm)' : 'none',
              transition: 'all var(--transition)',
            }}>{tab.label}</button>
          ))}
        </div>

        {/* ═══ OVERVIEW ═══ */}
        {activeTab === 'overview' && (
          <div className="animate-in">
            {/* Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <StatCard label="Total Classes" value={totalClasses} icon="📅" color="var(--accent)" />
              <StatCard label="Present" value={totalAttended} icon="✅" color="var(--success)" />
              <StatCard label="Absent" value={totalAbsent} icon="❌" color="var(--error)" />
              <StatCard label="Percentage" value={`${overallPct}%`} icon="📈" color={pctColor} />
            </div>

            {/* Chart + Course Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: totalClasses > 0 ? '320px 1fr' : '1fr', gap: '1.25rem' }}>
              {totalClasses > 0 && (
                <div className="card">
                  <h3 style={{ marginTop: 0, fontSize: '0.95rem' }}>Attendance Split</h3>
                  <div style={{ height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                          paddingAngle={4} dataKey="value" strokeWidth={0}>
                          {chartData.map((_, i) => (
                            <Cell key={i} fill={i === 0 ? '#34d399' : '#f87171'} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }} />
                        <Legend wrapperStyle={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              <div className="card">
                <h3 style={{ marginTop: 0, fontSize: '0.95rem' }}>Course Breakdown</h3>
                {summary.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>No data yet</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table>
                      <thead><tr>
                        <th>Course</th><th>Total</th><th>Present</th><th>%</th><th>Progress</th>
                      </tr></thead>
                      <tbody>
                        {summary.map((item, i) => {
                          const pct = item.percentage;
                          const clr = pct >= 75 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--error)';
                          return (
                            <tr key={i}>
                              <td style={{ fontWeight: 500 }}>{item.courseId}</td>
                              <td>{item.totalClasses}</td>
                              <td style={{ color: 'var(--success)' }}>{item.attended}</td>
                              <td style={{ fontWeight: 700, color: clr }}>{pct}%</td>
                              <td style={{ minWidth: 100 }}>
                                <div className="progress-bar">
                                  <div className="progress-fill" style={{ width: `${pct}%`, background: clr }} />
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
          </div>
        )}

        {/* ═══ COURSES ═══ */}
        {activeTab === 'courses' && (
          <div className="animate-in">
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>My Enrolled Courses</h3>
            {myCourses.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📚</div>
                <p style={{ color: 'var(--text-muted)' }}>Not enrolled in any courses yet</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                {myCourses.map(course => (
                  <CourseCard key={course.id} course={course} enrolled />
                ))}
              </div>
            )}

            <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Available Courses</h3>
            {availableCourses.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No new courses available</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                {availableCourses.map(course => (
                  <CourseCard key={course.id} course={course} enrolled={false}
                    onEnroll={() => handleEnroll(course.id)} enrolling={enrolling === course.id} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ HISTORY ═══ */}
        {activeTab === 'history' && (
          <div className="card animate-in">
            <h3 style={{ marginTop: 0, fontSize: '1rem' }}>Attendance History</h3>
            {history.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>No records yet</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead><tr>
                    <th>Date</th><th>Course</th><th>Code</th><th>Status</th>
                  </tr></thead>
                  <tbody>
                    {history.map((rec, i) => (
                      <tr key={i}>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {new Date(rec.sessionDate).toLocaleDateString()}
                          <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {new Date(rec.sessionDate).toLocaleTimeString()}
                          </span>
                        </td>
                        <td style={{ fontWeight: 500 }}>{rec.courseName}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{rec.courseCode}</td>
                        <td><span className={`badge ${rec.status === 'PRESENT' ? 'badge-present' : 'badge-absent'}`}>{rec.status}</span></td>
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

/* ─── Sub-Components ─── */
function StatCard({ label, value, icon, color }) {
  return (
    <div className="card" style={{
      padding: '1rem', textAlign: 'center',
      borderTop: `2px solid ${color}`,
      marginBottom: 0,
    }}>
      <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{icon}</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    </div>
  );
}

function CourseCard({ course, enrolled, onEnroll, enrolling }) {
  return (
    <div className="card" style={{
      padding: '1.25rem', marginBottom: 0,
      borderLeft: `3px solid ${enrolled ? 'var(--success)' : 'var(--accent)'}`,
    }}>
      <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.3rem' }}>{course.courseName}</div>
      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
        {course.courseCode} · Sem {course.semester} · {course.department}
      </div>
      {enrolled ? (
        <span className="badge badge-present">Enrolled</span>
      ) : (
        <button onClick={onEnroll} disabled={enrolling} className="btn btn-primary"
          style={{ width: '100%', padding: '0.45rem', fontSize: '0.8rem' }}>
          {enrolling ? 'Enrolling...' : '+ Enroll'}
        </button>
      )}
    </div>
  );
}

export default StudentDashboard;
