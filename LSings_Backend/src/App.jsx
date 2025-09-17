import React, { useState, useEffect, useCallback } from 'react';
import CameraTrainer from './components/CameraTrainer';
import TrainingProgress from './components/TrainingProgress';
import { loadTrainingData, saveTrainingData } from './utils/dataStorage';
import './styles.css';

function App() {
  const [isCapturing, setIsCapturing] = useState(false);
  const [selectedVowel, setSelectedVowel] = useState(null);
  const [capturedData, setCapturedData] = useState({});
  const [serverData, setServerData] = useState([]);
  
  const VOWELS = ['A', 'E', 'I', 'O', 'U'];
  const MAX_FRAMES = 100;

  const API_BASE = import.meta.env.PROD 
      ? 'https://tu-backend.railway.app' 
      : 'http://localhost:5000';

  const compressLandmarks = (landmarks) => {
    return landmarks.map(coord => Math.round(coord * 1000) / 1000);
  };

  useEffect(() => {
    const data = loadTrainingData();
    setCapturedData(data);
    fetchServerData();
  }, []);

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
    if (!selectedVowel) return;

    setCapturedData(prevData => {
        const currentFrames = prevData[selectedVowel] || [];
        if (currentFrames.length < MAX_FRAMES) {
            const compressedLandmarks = compressLandmarks(landmarks);
            const newData = { 
                ...prevData, 
                [selectedVowel]: [...currentFrames, compressedLandmarks] 
            };
            saveTrainingData(newData);
            return newData;
        } else {
            setIsCapturing(false);
            return prevData;
        }
    });
  }, [selectedVowel]);

  const handleSelectVowel = (vowel) => {
    setIsCapturing(false);
    setSelectedVowel(vowel);
  };

  const toggleCapture = () => {
    if (!selectedVowel) {
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

  // Reemplazar el return actual con este:
return (
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
                    selectedVowel={selectedVowel}
                    capturedData={capturedData}
                    serverData={serverData}
                    isCapturing={isCapturing}
                    onSelectVowel={handleSelectVowel}
                    onToggleCapture={toggleCapture}
                    onDeleteData={handleDeleteVowelData}
                    onFinalize={handleFinalize}
                    onGetTip={() => {}}
                />
            </div>
        </div>
    </div>
);
}

export default App;