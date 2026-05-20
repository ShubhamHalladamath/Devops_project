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
  const [activeTab, setActiveTab] = useState('courses'); // courses | session | manage
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [studentHistory, setStudentHistory] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get('/teacher/profile');
      setProfile(res.data);
    } catch (err) { console.error(err); }
  }, []);

  const fetchCourses = useCallback(async () => {
    try {
      const res = await api.get('/teacher/courses');
      setCourses(res.data);
    } catch (err) { console.error(err); }
  }, []);

  const fetchSessionRecords = useCallback(async (sessionId) => {
    try {
      const res = await api.get(`/classroom/session/${sessionId}/records`);
      setSessionRecords(res.data);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchCourses();
  }, []);

  // Live poll when session is active
  useEffect(() => {
    if (!activeSession) return;
    fetchSessionRecords(activeSession.sessionId);
    const interval = setInterval(() => fetchSessionRecords(activeSession.sessionId), 5000);
    return () => clearInterval(interval);
  }, [activeSession, fetchSessionRecords]);

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/classroom/course', { ...newCourse, semester: parseInt(newCourse.semester) });
      setNewCourse({ courseCode: '', courseName: '', department: '', semester: '' });
      fetchCourses();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create course');
    }
  };

  const handleStartSession = async (courseId) => {
    setError('');
    try {
      const res = await api.post('/classroom/session/start', { courseId });
      setActiveSession(res.data);
      setActiveTab('session');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start session');
    }
  };

  const handleStopSession = async () => {
    if (!activeSession) return;
    try {
      await api.post(`/classroom/session/${activeSession.sessionId}/stop`);
      setActiveSession(null);
      setSessionRecords([]);
      setActiveTab('courses');
    } catch (err) {
      setError('Failed to stop session');
    }
  };

  const handleRefreshQR = async () => {
    if (!activeSession) return;
    try {
      const res = await api.post('/classroom/session/refresh', { sessionId: activeSession.sessionId });
      setActiveSession(res.data);
    } catch (err) {
      setError('Failed to refresh QR');
    }
  };

  const handleModifyAttendance = async (studentId, status, sessionId) => {
    const sid = sessionId || activeSession?.sessionId;
    try {
      await api.put(`/classroom/session/${sid}/attendance/${studentId}`, { status });
      if (activeSession) fetchSessionRecords(activeSession.sessionId);
      if (studentHistory && selectedStudent) {
        loadStudentHistory(selectedCourse.id, selectedStudent.id);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to modify attendance');
    }
  };

  const loadCourseStudents = async (course) => {
    setSelectedCourse(course);
    setSelectedStudent(null);
    setStudentHistory(null);
    setLoadingStudents(true);
    try {
      const res = await api.get(`/classroom/course/${course.id}/students`);
      setEnrolledStudents(res.data);
      setActiveTab('manage');
    } catch (err) {
      setError('Failed to load students');
    } finally {
      setLoadingStudents(false);
    }
  };

  const loadStudentHistory = async (courseId, studentId) => {
    try {
      const res = await api.get(`/classroom/course/${courseId}/student/${studentId}/history`);
      setStudentHistory(res.data);
    } catch (err) {
      alert('Failed to load student history');
    }
  };

  const handleStudentClick = (student) => {
    setSelectedStudent(student);
    loadStudentHistory(selectedCourse.id, student.id);
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  const tabs = [
    { key: 'courses', label: '📚 My Courses' },
    { key: 'session', label: activeSession ? '🟢 Live Session' : '⭕ Session', disabled: !activeSession },
    { key: 'manage', label: '👥 Manage Students', disabled: !selectedCourse },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-color)' }}>
      {/* Nav */}
      <nav style={{
        background: 'var(--card-bg)', borderBottom: '1px solid var(--border-color)',
        padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'linear-gradient(135deg, #7c3aed, var(--primary-color))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 'bold', fontSize: '1.2rem'
          }}>
            {profile?.name?.charAt(0) || 'T'}
          </div>
          <div>
            <div style={{ fontWeight: 600 }}>{profile?.name || 'Teacher'}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {profile?.department} | {profile?.employeeCode}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {activeSession && (
            <span style={{
              background: '#22c55e22', color: '#22c55e',
              padding: '0.25rem 0.75rem', borderRadius: 999, fontWeight: 600, fontSize: '0.8rem',
              animation: 'pulse 2s infinite'
            }}>
              ● LIVE SESSION
            </span>
          )}
          <button onClick={handleLogout} className="btn" style={{
            background: 'var(--error-color)', color: 'white', padding: '0.4rem 1rem', fontSize: '0.85rem'
          }}>Logout</button>
        </div>
      </nav>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1rem' }}>

        {/* Error Banner */}
        {error && (
          <div style={{
            padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1.5rem',
            background: '#ef444422', color: '#ef4444', border: '1px solid #ef444444', fontWeight: 500,
          }}>
            {error}
            <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>✕</button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '2rem', alignItems: 'start' }}>

          {/* Sidebar */}
          <div>
            {/* Create Course */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ marginTop: 0, fontSize: '1rem' }}>➕ Create Course</h3>
              <form onSubmit={handleCreateCourse}>
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
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Create Course</button>
              </form>
            </div>
          </div>

          {/* Main Panel */}
          <div>
            {/* Tab Bar */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--border-color)', paddingBottom: 0 }}>
              {tabs.map(tab => (
                <button key={tab.key}
                  onClick={() => !tab.disabled && setActiveTab(tab.key)}
                  disabled={tab.disabled}
                  style={{
                    background: 'none', border: 'none', cursor: tab.disabled ? 'not-allowed' : 'pointer',
                    padding: '0.75rem 1.25rem', fontWeight: 600, fontSize: '0.9rem',
                    color: tab.disabled ? 'var(--border-color)' : activeTab === tab.key ? 'var(--primary-color)' : 'var(--text-secondary)',
                    borderBottom: activeTab === tab.key ? '2px solid var(--primary-color)' : '2px solid transparent',
                    marginBottom: '-2px', transition: 'all 0.2s',
                  }}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ===== COURSES TAB ===== */}
            {activeTab === 'courses' && (
              <div>
                {courses.length === 0 ? (
                  <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
                    <p style={{ color: 'var(--text-secondary)' }}>No courses yet. Create your first course!</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {courses.map(course => (
                      <div key={course.id} className="card" style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        flexWrap: 'wrap', gap: '1rem', borderLeft: '4px solid var(--primary-color)'
                      }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>
                            {course.courseCode} — {course.courseName}
                          </div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                            Sem {course.semester} | {course.department}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => loadCourseStudents(course)}
                            className="btn"
                            style={{ background: 'var(--border-color)', color: 'var(--text-color)', padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                            👥 Students
                          </button>
                          <button
                            onClick={() => handleStartSession(course.id)}
                            disabled={activeSession !== null}
                            className="btn btn-primary"
                            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                            {activeSession?.courseId === course.id ? '🟢 Running' : '▶ Start Session'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ===== SESSION TAB ===== */}
            {activeTab === 'session' && activeSession && (
              <div>
                {/* QR Card */}
                <div className="card" style={{ border: '2px solid #22c55e', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                      <h2 style={{ margin: 0, color: '#22c55e' }}>🟢 Live QR Session</h2>
                      <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        Expires: {new Date(activeSession.expiresAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={handleRefreshQR} className="btn"
                        style={{ background: '#f59e0b22', color: '#f59e0b', border: '1px solid #f59e0b44' }}>
                        🔄 Refresh QR
                      </button>
                      <button onClick={handleStopSession} className="btn"
                        style={{ background: '#ef444422', color: '#ef4444', border: '1px solid #ef444444' }}>
                        ⏹ End Session
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem', background: 'white', borderRadius: '1rem' }}>
                    <QRCodeSVG value={activeSession.qrToken} size={380} level="L" includeMargin={true} />
                  </div>
                </div>

                {/* Live Attendance */}
                <div className="card">
                  <h3 style={{ marginTop: 0 }}>
                    Live Attendance
                    <span style={{ marginLeft: '0.75rem', background: '#22c55e22', color: '#22c55e', borderRadius: 999, padding: '0.15rem 0.6rem', fontSize: '0.8rem', fontWeight: 600 }}>
                      {sessionRecords.filter(r => r.status === 'PRESENT').length} Present
                    </span>
                  </h3>
                  {sessionRecords.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0' }}>
                      Waiting for students to scan...
                    </p>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                            <th style={{ padding: '0.75rem' }}>Name</th>
                            <th style={{ padding: '0.75rem' }}>Roll No</th>
                            <th style={{ padding: '0.75rem' }}>Status</th>
                            <th style={{ padding: '0.75rem' }}>Override</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sessionRecords.map((record, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <td style={{ padding: '0.75rem', fontWeight: 500 }}>{record.studentName}</td>
                              <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{record.rollNumber}</td>
                              <td style={{ padding: '0.75rem' }}>
                                <StatusBadge status={record.status} />
                              </td>
                              <td style={{ padding: '0.75rem' }}>
                                {record.status === 'PRESENT' ? (
                                  <ActionBtn
                                    label="Mark Absent"
                                    onClick={() => handleModifyAttendance(record.studentId, 'ABSENT')}
                                    color="#ef4444"
                                  />
                                ) : (
                                  <ActionBtn
                                    label="Mark Present"
                                    onClick={() => handleModifyAttendance(record.studentId, 'PRESENT')}
                                    color="#22c55e"
                                  />
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

            {/* ===== MANAGE STUDENTS TAB ===== */}
            {activeTab === 'manage' && selectedCourse && (
              <div>
                <div style={{ marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0 }}>
                    👥 {selectedCourse.courseName}
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 400, marginLeft: '0.5rem' }}>
                      ({selectedCourse.courseCode})
                    </span>
                  </h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: studentHistory ? '1fr 1fr' : '1fr', gap: '1.5rem' }}>
                  {/* Student List */}
                  <div className="card">
                    <h4 style={{ marginTop: 0 }}>Enrolled Students ({enrolledStudents.length})</h4>
                    {loadingStudents ? (
                      <p>Loading...</p>
                    ) : enrolledStudents.length === 0 ? (
                      <p style={{ color: 'var(--text-secondary)' }}>No students enrolled yet.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {enrolledStudents.map(student => (
                          <div key={student.id}
                            onClick={() => handleStudentClick(student)}
                            style={{
                              padding: '0.75rem 1rem',
                              borderRadius: '0.5rem',
                              cursor: 'pointer',
                              background: selectedStudent?.id === student.id ? 'var(--primary-color)11' : 'var(--bg-color)',
                              border: selectedStudent?.id === student.id ? '1px solid var(--primary-color)' : '1px solid var(--border-color)',
                              transition: 'all 0.15s',
                            }}>
                            <div style={{ fontWeight: 600 }}>{student.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              Roll: {student.rollNumber} | Sem {student.semester}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Student History */}
                  {studentHistory && selectedStudent && (
                    <div className="card">
                      <h4 style={{ marginTop: 0 }}>
                        📋 {selectedStudent.name}'s History
                        <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-secondary)' }}>
                          ({selectedStudent.rollNumber})
                        </span>
                      </h4>
                      {studentHistory.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)' }}>No sessions conducted yet.</p>
                      ) : (
                        <div style={{ overflowY: 'auto', maxHeight: 400 }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead>
                              <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', position: 'sticky', top: 0, background: 'var(--card-bg)' }}>
                                <th style={{ padding: '0.6rem' }}>Date</th>
                                <th style={{ padding: '0.6rem' }}>Status</th>
                                <th style={{ padding: '0.6rem' }}>Change</th>
                              </tr>
                            </thead>
                            <tbody>
                              {studentHistory.map((rec, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                  <td style={{ padding: '0.6rem' }}>
                                    {new Date(rec.sessionDate).toLocaleDateString()} <br />
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                      {new Date(rec.sessionDate).toLocaleTimeString()}
                                    </span>
                                  </td>
                                  <td style={{ padding: '0.6rem' }}>
                                    <StatusBadge status={rec.status} />
                                  </td>
                                  <td style={{ padding: '0.6rem' }}>
                                    {rec.status === 'PRESENT' ? (
                                      <ActionBtn label="→ Absent" onClick={() => handleModifyAttendance(selectedStudent.id, 'ABSENT', rec.sessionId)} color="#ef4444" />
                                    ) : (
                                      <ActionBtn label="→ Present" onClick={() => handleModifyAttendance(selectedStudent.id, 'PRESENT', rec.sessionId)} color="#22c55e" />
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      {/* Summary */}
                      {studentHistory.length > 0 && (
                        <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--bg-color)', borderRadius: '0.5rem', fontSize: '0.85rem' }}>
                          {(() => {
                            const present = studentHistory.filter(r => r.status === 'PRESENT').length;
                            const total = studentHistory.length;
                            const pct = total > 0 ? Math.round((present / total) * 100) : 0;
                            const clr = pct >= 75 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';
                            return (
                              <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                                <span>📅 Total: <b>{total}</b></span>
                                <span style={{ color: '#22c55e' }}>✅ Present: <b>{present}</b></span>
                                <span style={{ color: '#ef4444' }}>❌ Absent: <b>{total - present}</b></span>
                                <span style={{ color: clr, fontWeight: 700 }}>{pct}%</span>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const isPresent = status === 'PRESENT';
  return (
    <span style={{
      display: 'inline-block',
      padding: '0.2rem 0.75rem',
      borderRadius: 999,
      fontWeight: 600,
      fontSize: '0.78rem',
      background: isPresent ? '#22c55e22' : '#ef444422',
      color: isPresent ? '#22c55e' : '#ef4444',
    }}>
      {status}
    </span>
  );
}

function ActionBtn({ label, onClick, color }) {
  return (
    <button onClick={onClick} style={{
      padding: '0.2rem 0.6rem',
      background: color + '22',
      color: color,
      border: `1px solid ${color}44`,
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '0.78rem',
      fontWeight: 600,
    }}>
      {label}
    </button>
  );
}

export default TeacherDashboard;
