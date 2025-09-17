import React from 'react';
import ProgressCards from './ProgressCards';
import VowelSelection from './VowelSelection';
import RecentSessions from './RecentSessions';
import LoadingSpinner from '../common/LoadingSpinner';
import './Dashboard.css';

const Dashboard = ({ userProgress, recentSessions, onVowelSelect, hasError, isLoading }) => {
  
  if (isLoading) {
    return (
      <div className="dashboard">
        <div className="loading-section">
          <LoadingSpinner />
          <p>Cargando datos de progreso...</p>
        </div>
      </div>
    );
  }

  const vowels = [
    { 
      id: 'A', 
      name: 'Vocal A', 
      description: 'Pulgar extendido hacia arriba con otros dedos cerrados.',
      accuracy: userProgress?.vowelProgress?.A?.accuracy || 0
    },
    { 
      id: 'E', 
      name: 'Vocal E', 
      description: 'Dedos curvados hacia la palma de la mano.',
      accuracy: userProgress?.vowelProgress?.E?.accuracy || 0
    },
    { 
      id: 'I', 
      name: 'Vocal I', 
      description: 'Dedo meñique extendido, otros dedos cerrados.',
      accuracy: userProgress?.vowelProgress?.I?.accuracy || 0
    },
    { 
      id: 'O', 
      name: 'Vocal O', 
      description: 'Forma circular con todos los dedos.',
      accuracy: userProgress?.vowelProgress?.O?.accuracy || 0
    },
    { 
      id: 'U', 
      name: 'Vocal U', 
      description: 'Dedos índice y medio extendidos juntos.',
      accuracy: userProgress?.vowelProgress?.U?.accuracy || 0
    }
  ];

  return (
    <div className="dashboard">
      <section className="hero">
        <h2>Aprende Lenguaje de Señas con IA</h2>
        <p>Sistema inteligente de reconocimiento de gestos para dominar las vocales del lenguaje de señas. Entrenamientos personalizados con feedback en tiempo real.</p>
        
        {hasError && (
          <div className="hero-warning">
            ⚠️ No se pudo conectar con el backend. Los datos pueden estar desactualizados.
          </div>
        )}
      </section>

      <ProgressCards progress={userProgress} />
      
      <div className="dashboard-columns">
        <div className="column">
          <div className="mastered-vowels-section">
            <h3>Vocales Dominadas</h3>
            <div className="vowels-list">
              {userProgress?.masteredVowels?.map(vowel => (
                <span key={vowel} className="vowel-badge mastered">{vowel}</span>
              ))}
              {(['A', 'E', 'I', 'O', 'U'].filter(v => !userProgress?.masteredVowels?.includes(v))).map(vowel => (
                <span key={vowel} className="vowel-badge">{vowel}</span>
              ))}
            </div>
          </div>

          <RecentSessions sessions={recentSessions} />
        </div>

        <div className="column">
          <VowelSelection vowels={vowels} onVowelSelect={onVowelSelect} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;