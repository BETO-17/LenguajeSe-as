import React from 'react';
import './RecentSessions.css';

const RecentSessions = ({ sessions }) => {
  if (!sessions || sessions.length === 0) {
    return (
      <div className="recent-sessions">
        <h3>Sesiones Recientes</h3>
        <p className="no-sessions">No hay sesiones registradas</p>
      </div>
    );
  }

  return (
    <div className="recent-sessions">
      <h3>Sesiones Recientes</h3>
      <div className="sessions-list">
        {sessions.map((session, index) => (
          <div key={index} className="session-item">
            <div className="session-info">
              <strong>Vocal {session.vowel}</strong>
              <span>{session.frames} frames</span>
            </div>
            <span className="session-time">Hace {session.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentSessions;