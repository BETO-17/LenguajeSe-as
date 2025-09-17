import React from 'react';
import './Header.css';

// El componente Header ahora acepta props para manejar la navegación
const Header = ({ onGoToAdminTraining, onGoToDashboard, currentView }) => {
  return (
    <header className="app-header">
      <div className="header-content">
        <h1>SignLearn AI</h1>
        <p>Sistema de tratamiento con IA</p>
      </div>
      <nav className="app-navigation"> {/* Nueva sección para los botones de navegación */}
        <button
          onClick={onGoToDashboard}
          className={`nav-button ${currentView === 'dashboard' ? 'active' : ''}`}
        >
          Mi Progreso
        </button>
        <button
          onClick={onGoToAdminTraining}
          className={`nav-button ${currentView === 'adminTraining' ? 'active' : ''}`}
        >
          Panel de Entrenamiento
        </button>
      </nav>
    </header>
  );
};

export default Header;