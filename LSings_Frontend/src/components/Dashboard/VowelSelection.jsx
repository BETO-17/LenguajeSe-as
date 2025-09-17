import React from 'react';
import './VowelSelection.css';

const VowelSelection = ({ vowels, onVowelSelect }) => {
  return (
    <div className="vowel-selection">
      <h3>Selecciona una Vocal para Entrenar</h3>
      <div className="vowel-cards">
        {vowels.map(vowel => (
          <div 
            key={vowel.id} 
            className="vowel-card"
            onClick={() => onVowelSelect(vowel)}
          >
            <h4>Vocal {vowel.id}</h4>
            <p>{vowel.description}</p>
            
            <div className="vowel-stats">
              <div className="stat">
                <span className="stat-label">Precisión:</span>
                <span className="stat-value">{vowel.accuracy}%</span>
              </div>
              <div className="stat">
                <span className="stat-label">Sesiones:</span>
                <span className="stat-value">{vowel.sessions || 0}</span>
              </div>
            </div>
            
            <button className="start-button">
              {vowel.accuracy > 0 ? 'Continuar Practicando' : 'Comenzar a Practicar'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VowelSelection;