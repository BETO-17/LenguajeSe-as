import React from 'react';
import './ProgressCards.css';

const ProgressCards = ({ progress }) => {
  if (!progress) return null;

  return (
    <section className="progress-section">
      <h3>Tu Progreso</h3>
      <div className="progress-cards">
        <div className="progress-card">
          <span className="progress-value">{progress.completed}/{progress.total}</span>
          <span className="progress-label">Vocales Completadas</span>
        </div>
        <div className="progress-card">
          <span className="progress-value">{progress.accuracy}%</span>
          <span className="progress-label">Precisión Promedio</span>
        </div>
        <div className="progress-card">
          <span className="progress-value">{progress.sessions}</span>
          <span className="progress-label">Sesiones Internas</span>
        </div>
        <div className="progress-card">
          <span className="progress-value">{progress.totalTime}</span>
          <span className="progress-label">Tiempo Total</span>
        </div>
      </div>
    </section>
  );
};

export default ProgressCards;