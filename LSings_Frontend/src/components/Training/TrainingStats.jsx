import React from 'react';
import './TrainingStats.css';

const TrainingStats = ({ stats, vowelProgress }) => {
  if (!stats) return null;

  const currentVowelStats = vowelProgress ? vowelProgress : {};

  return (
    <div className="training-stats">
      <h3>Estadísticas de Entrenamiento</h3>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <span className="stat-value">{stats.attempts || 0}</span>
            <span className="stat-label">Intentos</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <span className="stat-value">{stats.correct || 0}</span>
            <span className="stat-label">Correctos</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <span className="stat-value">{stats.accuracy ? stats.accuracy.toFixed(1) : 0}%</span>
            <span className="stat-label">Precisión</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-content">
            <span className="stat-value">{stats.time || 0}</span>
            <span className="stat-label">Tiempo (s)</span>
          </div>
        </div>
      </div>

      {/* Estadísticas específicas por vocal */}
      {currentVowelStats && (
        <div className="vowel-specific-stats">
          <h4>Progreso de la Vocal</h4>
          <div className="vowel-stats-grid">
            <div className="vowel-stat">
              <span className="vowel-stat-label">Sesiones:</span>
              <span className="vowel-stat-value">{currentVowelStats.sessions || 0}</span>
            </div>
            <div className="vowel-stat">
              <span className="vowel-stat-label">Frames Totales:</span>
              <span className="vowel-stat-value">{currentVowelStats.totalFrames || 0}</span>
            </div>
            <div className="vowel-stat">
              <span className="vowel-stat-label">Precisión:</span>
              <span className="vowel-stat-value">{currentVowelStats.accuracy || 0}%</span>
            </div>
            <div className="vowel-stat">
              <span className="vowel-stat-label">Estado:</span>
              <span className={`vowel-stat-value status ${currentVowelStats.mastered ? 'mastered' : 'learning'}`}>
                {currentVowelStats.mastered ? 'Dominada' : 'Aprendiendo'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Barra de progreso */}
      {currentVowelStats && (
        <div className="progress-section">
          <div className="progress-header">
            <span>Progreso de Dominio</span>
            <span>{Math.min(100, Math.floor((currentVowelStats.totalFrames || 0) / 3))}%</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${Math.min(100, Math.floor((currentVowelStats.totalFrames || 0) / 3))}%` }}
            ></div>
          </div>
          <div className="progress-note">
            {currentVowelStats.totalFrames || 0} frames de 300 necesarios para dominar
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainingStats;