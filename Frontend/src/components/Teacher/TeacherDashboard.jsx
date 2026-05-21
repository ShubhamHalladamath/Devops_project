import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { QRCodeSVG } from 'qrcode.react';

function TeacherDashboard() {
  const [profile, setProfile] = useState(null);
  const [courses, setCourses] = useState([]);
  const [newCourse, setNewCourse] = useState({ courseCode: '', courseName: '', department: '', semester: '' });
  const [activeSession, setActiveSession] = useState(null);
  const [sessionRecords, setSessionRecords] = useState([]);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('courses');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [studentHistory, setStudentHistory] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const fetchProfile = useCallback(async () => {
    try { const res = await api.get('/teacher/profile'); setProfile(res.data); }
    catch (err) { console.error(err); }
  }, []);

  const fetchCourses = useCallback(async () => {
    try { const res = await api.get('/teacher/courses'); setCourses(res.data); }
    catch (err) { console.error(err); }
  }, []);

  const fetchSessionRecords = useCallback(async (sessionId) => {
    try { const res = await api.get(`/classroom/session/${sessionId}/records`); setSessionRecords(res.data); }
    catch (err) { console.error(err); }
  }, []);

  useEffect(() => { fetchProfile(); fetchCourses(); }, []);

  useEffect(() => {
    if (!activeSession) return;
    fetchSessionRecords(activeSession.sessionId);
    const interval = setInterval(() => fetchSessionRecords(activeSession.sessionId), 5000);
    return () => clearInterval(interval);
  }, [activeSession, fetchSessionRecords]);

  const handleCreateCourse = async (e) => {
    e.preventDefault(); setError('');
    try {
      await api.post('/classroom/course', { ...newCourse, semester: parseInt(newCourse.semester) });
      setNewCourse({ courseCode: '', courseName: '', department: '', semester: '' });
      setShowCreateForm(false);
      fetchCourses();
    } catch (err) { setError(err.response?.data?.error || 'Failed to create course'); }
  };

  const handleStartSession = async (courseId) => {
    setError('');
    try { const res = await api.post('/classroom/session/start', { courseId }); setActiveSession(res.data); setActiveTab('session'); }
    catch (err) { setError(err.response?.data?.error || 'Failed to start session'); }
  };

  const handleStopSession = async () => {
    if (!activeSession) return;
    try { await api.post(`/classroom/session/${activeSession.sessionId}/stop`); setActiveSession(null); setSessionRecords([]); setActiveTab('courses'); }
    catch (err) { setError('Failed to stop session'); }
  };

  const handleRefreshQR = async () => {
    if (!activeSession) return;
    try { const res = await api.post('/classroom/session/refresh', { sessionId: activeSession.sessionId }); setActiveSession(res.data); }
    catch (err) { setError('Failed to refresh QR'); }
  };

  const handleModifyAttendance = async (studentId, status, sessionId) => {
    const sid = sessionId || activeSession?.sessionId;
    try {
      await api.put(`/classroom/session/${sid}/attendance/${studentId}`, { status });
      if (activeSession) fetchSessionRecords(activeSession.sessionId);
      if (studentHistory && selectedStudent) loadStudentHistory(selectedCourse.id, selectedStudent.id);
    } catch (err) { alert(err.response?.data?.error || 'Failed to modify'); }
  };

  const loadCourseStudents = async (course) => {
    setSelectedCourse(course); setSelectedStudent(null); setStudentHistory(null);
    setLoadingStudents(true);
    try { const res = await api.get(`/classroom/course/${course.id}/students`); setEnrolledStudents(res.data); setActiveTab('manage'); }
    catch (err) { setError('Failed to load students'); }
    finally { setLoadingStudents(false); }
  };

  const loadStudentHistory = async (courseId, studentId) => {
    try { const res = await api.get(`/classroom/course/${courseId}/student/${studentId}/history`); setStudentHistory(res.data); }
    catch (err) { alert('Failed to load history'); }
  };

  const handleStudentClick = (student) => {
    setSelectedStudent(student);
    loadStudentHistory(selectedCourse.id, student.id);
  };

  const handleLogout = () => { localStorage.clear(); window.location.href = '/'; };

  const presentCount = sessionRecords.filter(r => r.status === 'PRESENT').length;

  const tabs = [
    { key: 'courses', label: '📚 Courses' },
    { key: 'session', label: activeSession ? '🟢 Live' : '⭕ Session', disabled: !activeSession },
    { key: 'manage', label: '👥 Students', disabled: !selectedCourse },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* ─── Nav ─── */}
      <nav style={{
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        padding: '0.75rem 1.5rem', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', position: 'sticky', top: 0, zIndex: 100,
        backdropFilter: 'blur(16px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #8b5cf6, var(--accent))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: '0.9rem',
            boxShadow: '0 2px 8px rgba(139, 92, 246, 0.2)',
          }}>
            {profile?.name?.charAt(0) || 'T'}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{profile?.name || 'Teacher'}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {profile?.department} · {profile?.employeeCode}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {activeSession && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
              background: 'var(--success-bg)', color: 'var(--success)',
              padding: '0.2rem 0.65rem', borderRadius: 999,
              fontWeight: 700, fontSize: '0.75rem',
              border: '1px solid rgba(52,211,153,0.2)',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', animation: 'pulse-dot 1.5s infinite' }} />
              LIVE
            </span>
          )}
          <button onClick={handleLogout} className="btn btn-danger"
            style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem' }}>
            Logout
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.5rem 1rem' }}>

        {/* Error */}
        {error && (
          <div className="animate-in" style={{
            padding: '0.7rem 1rem', borderRadius: 'var(--radius-md)',
            marginBottom: '1.25rem', fontSize: '0.85rem', fontWeight: 500,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: 'var(--error-bg)', color: 'var(--error)',
            border: '1px solid rgba(248,113,113,0.2)',
          }}>
            <span>⚠️ {error}</span>
            <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>✕</button>
          </div>
        )}

        {/* ─── Tabs ─── */}
        <div style={{
          display: 'flex', gap: '0.25rem', marginBottom: '1.5rem',
          background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '0.3rem',
        }}>
          {tabs.map(tab => (
            <button key={tab.key}
              onClick={() => !tab.disabled && setActiveTab(tab.key)}
              disabled={tab.disabled}
              style={{
                flex: 1, padding: '0.6rem', borderRadius: 'var(--radius-sm)',
                border: 'none', cursor: tab.disabled ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', fontWeight: 600, fontSize: '0.85rem',
                background: activeTab === tab.key ? 'var(--surface)' : 'transparent',
                color: tab.disabled ? 'var(--text-muted)' : activeTab === tab.key ? 'var(--accent)' : 'var(--text-secondary)',
                boxShadow: activeTab === tab.key ? 'var(--shadow-sm)' : 'none',
                transition: 'all var(--transition)', opacity: tab.disabled ? 0.5 : 1,
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ═══════ COURSES ═══════ */}
        {activeTab === 'courses' && (
          <div className="animate-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.15rem' }}>My Courses</h2>
              <button onClick={() => setShowCreateForm(!showCreateForm)}
                className={showCreateForm ? 'btn btn-ghost' : 'btn btn-primary'}
                style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                {showCreateForm ? '✕ Cancel' : '+ New Course'}
              </button>
            </div>

            {/* Create Form */}
            {showCreateForm && (
              <div className="card animate-in" style={{
                marginBottom: '1.5rem',
                border: '1px solid var(--accent)33',
                background: 'linear-gradient(135deg, var(--accent-subtle), var(--surface))',
              }}>
                <h3 style={{ marginTop: 0, fontSize: '0.95rem' }}>Create New Course</h3>
                <form onSubmit={handleCreateCourse}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
                    <div className="form-group">
                      <label>Course Code</label>
                      <input type="text" placeholder="e.g. CS301" value={newCourse.courseCode}
                        onChange={e => setNewCourse({ ...newCourse, courseCode: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label>Course Name</label>
                      <input type="text" placeholder="e.g. Data Structures" value={newCourse.courseName}
                        onChange={e => setNewCourse({ ...newCourse, courseName: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label>Department</label>
                      <input type="text" placeholder="e.g. CSE" value={newCourse.department}
                        onChange={e => setNewCourse({ ...newCourse, department: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label>Semester</label>
                      <input type="number" min={1} max={8} placeholder="1-8" value={newCourse.semester}
                        onChange={e => setNewCourse({ ...newCourse, semester: e.target.value })} required />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.65rem' }}>
                    Create Course
                  </button>
                </form>
              </div>
            )}

            {/* Course List */}
            {courses.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📚</div>
                <p style={{ color: 'var(--text-muted)' }}>No courses yet. Create your first course!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {courses.map(course => (
                  <div key={course.id} className="card" style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    flexWrap: 'wrap', gap: '1rem', marginBottom: 0,
                    borderLeft: '3px solid var(--accent)',
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                        {course.courseCode} — {course.courseName}
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                        Sem {course.semester} · {course.department}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => loadCourseStudents(course)} className="btn btn-ghost"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                        👥 Students
                      </button>
                      <button onClick={() => handleStartSession(course.id)} disabled={activeSession !== null}
                        className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                        ▶ Start Session
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════ SESSION ═══════ */}
        {activeTab === 'session' && activeSession && (
          <div className="animate-in">
            {/* QR Card */}
            <div className="card" style={{
              border: '1px solid rgba(52,211,153,0.3)',
              background: 'linear-gradient(135deg, rgba(52,211,153,0.04), var(--surface))',
              marginBottom: '1.25rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--success)' }}>🟢 Live Session</h2>
                  <p style={{ margin: '0.15rem 0 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    Expires: {new Date(activeSession.expiresAt).toLocaleTimeString()}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button onClick={handleRefreshQR} className="btn btn-ghost" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                    🔄 Refresh
                  </button>
                  <button onClick={handleStopSession} className="btn btn-danger" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                    ⏹ End
                  </button>
                </div>
              </div>

              <div style={{
                display: 'flex', justifyContent: 'center', padding: '1.5rem',
                background: '#ffffff', borderRadius: 'var(--radius-lg)',
                boxShadow: '0 0 24px rgba(52,211,153,0.1)',
              }}>
                <QRCodeSVG value={activeSession.qrToken} size={360} level="L" includeMargin={true} />
              </div>
            </div>

            {/* Live Attendance Table */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '0.95rem' }}>Live Attendance</h3>
                <span className="badge badge-present" style={{ fontSize: '0.75rem' }}>
                  {presentCount} Present
                </span>
              </div>
              {sessionRecords.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0', fontSize: '0.9rem' }}>
                  ⏳ Waiting for students to scan...
                </p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table>
                    <thead><tr>
                      <th>Name</th><th>Roll No</th><th>Status</th><th>Override</th>
                    </tr></thead>
                    <tbody>
                      {sessionRecords.map((rec, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 500 }}>{rec.studentName}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>{rec.rollNumber}</td>
                          <td><span className={`badge ${rec.status === 'PRESENT' ? 'badge-present' : 'badge-absent'}`}>{rec.status}</span></td>
                          <td>
                            {rec.status === 'PRESENT' ? (
                              <button onClick={() => handleModifyAttendance(rec.studentId, 'ABSENT')}
                                className="btn btn-danger" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>
                                → Absent
                              </button>
                            ) : (
                              <button onClick={() => handleModifyAttendance(rec.studentId, 'PRESENT')}
                                className="btn btn-success" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>
                                → Present
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════ MANAGE STUDENTS ═══════ */}
        {activeTab === 'manage' && selectedCourse && (
          <div className="animate-in">
            <div style={{ marginBottom: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem' }}>
                {selectedCourse.courseName}
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 400, marginLeft: '0.5rem' }}>
                  ({selectedCourse.courseCode})
                </span>
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: studentHistory ? '1fr 1.3fr' : '1fr', gap: '1.25rem' }}>
              {/* Student List */}
              <div className="card">
                <h3 style={{ marginTop: 0, fontSize: '0.95rem' }}>
                  Students
                  <span style={{ marginLeft: '0.5rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                    ({enrolledStudents.length})
                  </span>
                </h3>
                {loadingStudents ? (
                  <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
                ) : enrolledStudents.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No students enrolled yet</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {enrolledStudents.map(student => (
                      <div key={student.id} onClick={() => handleStudentClick(student)} style={{
                        padding: '0.65rem 0.9rem', borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        background: selectedStudent?.id === student.id ? 'var(--accent-subtle)' : 'var(--bg-secondary)',
                        border: `1px solid ${selectedStudent?.id === student.id ? 'var(--accent)33' : 'var(--border)'}`,
                        transition: 'all var(--transition)',
                      }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{student.name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          Roll: {student.rollNumber} · Sem {student.semester}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* History Panel */}
              {studentHistory && selectedStudent && (
                <div className="card animate-in">
                  <h3 style={{ marginTop: 0, fontSize: '0.95rem' }}>
                    {selectedStudent.name}
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)' }}>
                      ({selectedStudent.rollNumber})
                    </span>
                  </h3>

                  {/* Summary Bar */}
                  {studentHistory.length > 0 && (() => {
                    const present = studentHistory.filter(r => r.status === 'PRESENT').length;
                    const total = studentHistory.length;
                    const pct = total > 0 ? Math.round((present / total) * 100) : 0;
                    const clr = pct >= 75 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--error)';
                    return (
                      <div style={{
                        display: 'flex', justifyContent: 'space-around', alignItems: 'center',
                        padding: '0.7rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)',
                        fontSize: '0.8rem', marginBottom: '1rem',
                      }}>
                        <span>📅 <b>{total}</b></span>
                        <span style={{ color: 'var(--success)' }}>✅ <b>{present}</b></span>
                        <span style={{ color: 'var(--error)' }}>❌ <b>{total - present}</b></span>
                        <span style={{ color: clr, fontWeight: 700 }}>{pct}%</span>
                      </div>
                    );
                  })()}

                  {studentHistory.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No sessions yet</p>
                  ) : (
                    <div style={{ overflowY: 'auto', maxHeight: 360 }}>
                      <table>
                        <thead><tr>
                          <th>Date</th><th>Status</th><th>Override</th>
                        </tr></thead>
                        <tbody>
                          {studentHistory.map((rec, i) => (
                            <tr key={i}>
                              <td style={{ whiteSpace: 'nowrap' }}>
                                {new Date(rec.sessionDate).toLocaleDateString()}
                                <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                  {new Date(rec.sessionDate).toLocaleTimeString()}
                                </span>
                              </td>
                              <td><span className={`badge ${rec.status === 'PRESENT' ? 'badge-present' : 'badge-absent'}`}>{rec.status}</span></td>
                              <td>
                                {rec.status === 'PRESENT' ? (
                                  <button onClick={() => handleModifyAttendance(selectedStudent.id, 'ABSENT', rec.sessionId)}
                                    className="btn btn-danger" style={{ padding: '0.15rem 0.5rem', fontSize: '0.72rem' }}>
                                    → Absent
                                  </button>
                                ) : (
                                  <button onClick={() => handleModifyAttendance(selectedStudent.id, 'PRESENT', rec.sessionId)}
                                    className="btn btn-success" style={{ padding: '0.15rem 0.5rem', fontSize: '0.72rem' }}>
                                    → Present
                                  </button>
                                )}
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
        )}
      </div>
    </div>
  );
}

export default TeacherDashboard;
