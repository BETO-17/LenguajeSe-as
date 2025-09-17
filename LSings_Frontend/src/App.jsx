import React, { useState, useEffect, useCallback } from 'react';

// --- Imports de LSings_Frontend ---
import Dashboard from './components/Dashboard/Dashboard';
import TrainingView from './components/Training/TrainingView';
import Header from './components/common/Header';
import { useTrainingData } from './hooks/useTrainingData';
import LoadingSpinner from './components/common/LoadingSpinner';
import './App.css'; // Estilos globales de LSings_Frontend

// --- Imports de LSings_Backend ---
import CameraTrainer from './components/CameraTrainer'; 
import TrainingProgress from './components/TrainingProgress'; 
import { loadTrainingData, saveTrainingData } from './utils/dataStorage.jsx'; 
import './styles.css'; 

// --- Import necesario para monitoreo del modelo ---
import modelMonitor from './utils/modelMonitor.js';

function App() {
  // --- Estados de LSings_Frontend ---
  const [currentView, setCurrentView] = useState('dashboard'); 
  const [selectedVowelFrontend, setSelectedVowelFrontend] = useState(null); 
  const { userProgress, recentSessions, loading, error, refetch } = useTrainingData();

  // --- Estados de LSings_Backend ---
  const [isCapturing, setIsCapturing] = useState(false);
  const [selectedVowelAdmin, setSelectedVowelAdmin] = useState(null); 
  const [capturedData, setCapturedData] = useState({}); 
  const [serverData, setServerData] = useState([]); 

  // --- Constantes de LSings_Backend ---
  const VOWELS = ['A', 'E', 'I', 'O', 'U'];
  const MAX_FRAMES = 100;

  const API_BASE = import.meta.env.PROD 
    ? 'https://tu-backend.railway.app' 
    : 'http://localhost:5000'; 

  // --- Efecto: monitoreo de modelo ---
  useEffect(() => {
    try {
      modelMonitor.startAutoMonitoring();
    } catch (error) {
      console.error('Error iniciando monitoreo:', error);
    }
    return () => {
      try {
        modelMonitor.stopAutoMonitoring();
      } catch (error) {
        console.error('Error deteniendo monitoreo:', error);
      }
    };
  }, []);

  // --- Efecto: cargar datos ---
  useEffect(() => {
    const data = loadTrainingData();
    setCapturedData(data);
    fetchServerData();
  }, []); 

  // --- Funciones de Lógica de LSings_Backend ---
  const compressLandmarks = (landmarks) => {
    return landmarks.map(coord => Math.round(coord * 1000) / 1000);
  };

  const fetchServerData = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/training-data`);
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      
      const result = await response.json();
      setServerData(result.success ? result.files || [] : []);
    } catch (error) {
      console.error('Error fetching server data:', error);
      setServerData([]);
    }
  };

  const handleFrameCaptured = useCallback((landmarks) => {
    if (!selectedVowelAdmin) return;

    setCapturedData(prevData => {
        const currentFrames = prevData[selectedVowelAdmin] || [];
        if (currentFrames.length < MAX_FRAMES) {
            const compressedLandmarks = compressLandmarks(landmarks);
            const newData = { 
                ...prevData, 
                [selectedVowelAdmin]: [...currentFrames, compressedLandmarks] 
            };
            saveTrainingData(newData);
            return newData;
        } else {
            setIsCapturing(false);
            return prevData;
        }
    });
  }, [selectedVowelAdmin]); 

  const handleSelectVowelAdmin = (vowel) => { 
    setIsCapturing(false);
    setSelectedVowelAdmin(vowel);
  };

  const toggleCapture = () => {
    if (!selectedVowelAdmin) {
      alert("Por favor, selecciona una vocal para entrenar primero.");
      return;
    }
    setIsCapturing(prev => !prev);
  };

  const handleDeleteVowelData = async (vowel) => {
    if (window.confirm(`¿Estás seguro de que quieres borrar TODOS los datos de la vocal "${vowel}"?`)) {
      try {
        const response = await fetch(`${API_BASE}/api/delete-data/${vowel}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        
        const result = await response.json();
        if (result.success) {
          const newData = { ...capturedData };
          delete newData[vowel];
          setCapturedData(newData);
          saveTrainingData(newData);
          await fetchServerData();
          alert(`✅ ${result.message}`);
        } else {
          alert(`❌ Error: ${result.error}`);
        }
      } catch (error) {
        console.error('Error deleting data:', error);
        alert('❌ Error al conectar con el servidor.');
      }
    }
  };

  const handleFinalize = async () => {
    if (Object.keys(capturedData).length === 0) {
        alert("No hay datos para finalizar. ¡Captura algunos fotogramas primero!");
        return;
    }

    try {
        let savedCount = 0;
        let errors = [];
        
        for (const [vowel, data] of Object.entries(capturedData)) {
            if (data.length > 0) {
                try {
                    const response = await fetch(`${API_BASE}/api/save-data`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ vowel, data })
                    });
                    
                    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
                    
                    const result = await response.json();
                    if (result.success) savedCount++;
                    else errors.push(`${vowel}: ${result.error}`);
                } catch (error) {
                    errors.push(`${vowel}: ${error.message}`);
                }
            }
        }
        
        if (savedCount > 0) {
            alert(`✅ ${savedCount} vocales guardadas correctamente.`);
            await fetchServerData();
        }
        
        if (errors.length > 0) {
            alert(`❌ Algunos errores ocurrieron:\n${errors.join('\n')}`);
        }
    } catch (error) {
        console.error('Error in handleFinalize:', error);
        alert(`❌ Error general: ${error.message}`);
    }
  };

  // --- Funciones de Lógica de LSings_Frontend ---
  const handleVowelSelectFrontend = (vowel) => { 
    setSelectedVowelFrontend(vowel);
    setCurrentView('training');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedVowelFrontend(null);
    refetch(); 
  };

  const handleRetry = () => {
    refetch();
  };

  const emptyProgress = {
    completed: 0,
    total: 5,
    accuracy: 0,
    sessions: 0,
    totalTime: 0,
    masteredVowels: [],
    vowelProgress: {
      'A': { mastered: false, accuracy: 0, sessions: 0, totalFrames: 0 },
      'E': { mastered: false, accuracy: 0, sessions: 0, totalFrames: 0 },
      'I': { mastered: false, accuracy: 0, sessions: 0, totalFrames: 0 },
      'O': { mastered: false, accuracy: 0, sessions: 0, totalFrames: 0 },
      'U': { mastered: false, accuracy: 0, sessions: 0, totalFrames: 0 }
    }
  };

  const emptySessions = [];

  const handleGoToAdminTraining = () => {
    setCurrentView('adminTraining');
  };
  const handleGoToDashboard = () => {
    setCurrentView('dashboard');
  };

  if (loading && currentView === 'dashboard') { 
    return (
      <div className="app">
        <Header />
        <div className="loading-container">
          <LoadingSpinner />
          <p>Cargando datos de aprendizaje...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Header onGoToAdminTraining={handleGoToAdminTraining} onGoToDashboard={handleGoToDashboard} currentView={currentView} /> 
      
      {error && (
        <div className="error-banner">
          <div className="error-content">
            <span>⚠️ Error de conexión: {error}</span>
            <button onClick={handleRetry} className="retry-btn">
              Reintentar
            </button>
          </div>
        </div>
      )}
      
      <main className="app-main">
        {currentView === 'dashboard' && (
          <Dashboard 
            userProgress={userProgress || emptyProgress}
            recentSessions={recentSessions.length > 0 ? recentSessions : emptySessions}
            onVowelSelect={handleVowelSelectFrontend}
            hasError={!!error}
            isLoading={loading}
          />
        )}

        {currentView === 'training' && (
          <TrainingView 
            vowel={selectedVowelFrontend}
            userProgress={userProgress || emptyProgress}
            onBack={handleBackToDashboard}
          />
        )}

        {currentView === 'adminTraining' && (
            <div className="app-container"> 
                <div className="header-wrapper">
                    <header className="app-header">
                        <h1>Lenguaje_sings</h1>
                        <p>Backend de Entrenamiento - Panel de Administración</p>
                        <p className="server-info">
                            Servidor: {API_BASE} | Datos locales: {Object.keys(capturedData).filter(v => capturedData[v]?.length > 0).length} vocales
                        </p>
                    </header>
                </div>

                <div className="main-content">
                    <div className="main-grid">
                        <CameraTrainer 
                            isCapturing={isCapturing}
                            onFrameCaptured={handleFrameCaptured}
                        />
                        
                        <TrainingProgress 
                            vowels={VOWELS}
                            maxFrames={MAX_FRAMES}
                            selectedVowel={selectedVowelAdmin}
                            capturedData={capturedData}
                            serverData={serverData}
                            isCapturing={isCapturing}
                            onSelectVowel={handleSelectVowelAdmin}
                            onToggleCapture={toggleCapture}
                            onDeleteData={handleDeleteVowelData}
                            onFinalize={handleFinalize}
                            onGetTip={() => {}} 
                        />
                    </div>
                </div>
            </div>
        )}
      </main>
    </div>
  );
}

export default App;