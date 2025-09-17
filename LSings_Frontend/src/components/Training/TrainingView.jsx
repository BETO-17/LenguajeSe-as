import React, { useState, useCallback, useRef, useEffect } from 'react';
import CameraFeed from '../Camera/CameraFeed';
import TrainingStats from './TrainingStats';
import { useTrainingData } from '../../hooks/useTrainingData';
import { useVowelComparison } from '../../hooks/useVowelComparison';
import './TrainingView.css';

const TrainingView = ({ vowel, userProgress, onBack }) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    attempts: 0,
    correct: 0,
    accuracy: 0,
    time: 0
  });
  const [cameraError, setCameraError] = useState(null);
  const [currentStatus, setCurrentStatus] = useState('Coloque su mano en la cámara');
  const [lastResult, setLastResult] = useState(null);
  const [modelStatus, setModelStatus] = useState('Cargando modelo...');
  
  const { refetch } = useTrainingData();
  const { compare, isComparing, refreshModel } = useVowelComparison();
  
  const startTimeRef = useRef(0);
  const statsRef = useRef(sessionStats);

  // Verificar estado del modelo al iniciar
  useEffect(() => {
    const checkModel = async () => {
      try {
        setModelStatus('Verificando modelo...');
        // Aquí podrías agregar una llamada a tu backend para verificar
        // el estado del modelo y si está actualizado
        setModelStatus('Modelo listo');
      } catch (error) {
        setModelStatus('Error verificando modelo');
      }
    };

    checkModel();
  }, [vowel]);

  // Actualizar referencia de stats
  React.useEffect(() => {
    statsRef.current = sessionStats;
  }, [sessionStats]);

  const handleComparisonResult = useCallback((result) => {
    setSessionStats(prev => {
      const newAttempts = prev.attempts + 1;
      const newCorrect = result.match ? prev.correct + 1 : prev.correct;
      const newAccuracy = (newCorrect / newAttempts) * 100;
      
      // Actualizar último resultado
      setLastResult({
        match: result.match,
        confidence: result.confidence,
        timestamp: new Date().toISOString()
      });

      // Actualizar estado visual
      setCurrentStatus(result.match ? 
        `✅ ¡Correcto! Vocal ${vowel.id} detectada (${result.confidence.toFixed(0)}%)` : 
        `❌ Incorrecto. Se esperaba vocal ${vowel.id} (${result.confidence.toFixed(0)}%)`
      );

      // Resetear status después de 3 segundos
      setTimeout(() => {
        setCurrentStatus('Listo para comparar');
      }, 3000);

      return {
        attempts: newAttempts,
        correct: newCorrect,
        accuracy: newAccuracy,
        time: Math.floor((Date.now() - startTimeRef.current) / 1000)
      };
    });
  }, [vowel.id]);

  const handleLandmarksDetected = useCallback(async (landmarks) => {
    if (!vowel || !isCapturing || !landmarks) return;

    // Solo comparar si tenemos landmarks válidos (21 puntos clave = 63 valores)
    if (landmarks.length < 63) {
      setCurrentStatus('⚠️ Mano no detectada completamente');
      return;
    }

    // NO esperar si ya está comparando, dejar que el debounce maneje la frecuencia
    if (isComparing) {
      return; // Ya hay una comparación en proceso
    }

    setCurrentStatus('🔍 Comparando con modelo...');
    
    // Comparar con el modelo pre-entrenado (no await para no bloquear)
    compare(landmarks, vowel.id, handleComparisonResult);
  }, [vowel, isCapturing, isComparing, compare, handleComparisonResult]);

  const handleStartTraining = async () => {
    try {
      // Verificar permisos de cámara
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      
      setIsCapturing(true);
      setSessionStats({
        attempts: 0,
        correct: 0,
        accuracy: 0,
        time: 0
      });
      setCameraError(null);
      setCurrentStatus('Listo para comparar');
      setLastResult(null);
      startTimeRef.current = Date.now();
      
    } catch (error) {
      setCameraError('No se puede acceder a la cámara. Verifica los permisos.');
    }
  };

  const handleStopTraining = () => {
    setIsCapturing(false);
    setCurrentStatus('Entrenamiento detenido');
    setTimeout(() => refetch(), 1000);
  };

  // Función para forzar actualización del modelo
  const handleRefreshModel = async () => {
    setModelStatus('Actualizando modelo...');
    const success = await refreshModel();
    if (success) {
      setModelStatus('Modelo actualizado ✅');
    } else {
      setModelStatus('Error actualizando modelo ❌');
    }
  };

  const vowelData = userProgress?.vowelProgress?.[vowel.id] || {};

  return (
    <div className="training-view">
      <button className="back-button" onClick={onBack}>
        &larr; Volver al Dashboard
      </button>
      
      <h2>Entrenando Vocal {vowel.id}</h2>
      <p>Realice la seña correspondiente a la vocal {vowel.id} frente a la cámara</p>
      
      {cameraError && (
        <div className="error-message">
          <p>{cameraError}</p>
          <button className="retry-btn" onClick={handleStartTraining}>
            Reintentar
          </button>
        </div>
      )}
      
      <div className="training-content">
        <div className="camera-section">
          <CameraFeed 
            isCapturing={isCapturing}
            onLandmarksDetected={handleLandmarksDetected}
          />
          
          <div className="training-controls">
            {!isCapturing ? (
              <button 
                className="start-training-btn" 
                onClick={handleStartTraining}
                disabled={isComparing}
              >
                ▶️ Iniciar Verificación
              </button>
            ) : (
              <button 
                className="stop-training-btn" 
                onClick={handleStopTraining}
                disabled={isComparing}
              >
                ⏹️ Detener Verificación
              </button>
            )}
            
            {isCapturing && (
              <div className="capture-info">
                <div className="status-message">
                  <p className={lastResult?.match ? 'status-correct' : 'status-incorrect'}>
                    {currentStatus}
                  </p>
                </div>
                
                {lastResult && (
                  <div className="result-details">
                    <p>Confianza: <strong>{lastResult.confidence.toFixed(1)}%</strong></p>
                    <p>Resultado: <strong>{lastResult.match ? 'CORRECTO' : 'INCORRECTO'}</strong></p>
                  </div>
                )}
                
                <div className="stats-grid">
                  <div className="stat-item">
                    <span className="stat-label">Comparaciones:</span>
                    <span className="stat-value">{sessionStats.attempts}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Precisión:</span>
                    <span className="stat-value">{sessionStats.accuracy.toFixed(1)}%</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Tiempo:</span>
                    <span className="stat-value">{sessionStats.time}s</span>
                  </div>
                </div>
                
                {isComparing && (
                  <div className="processing-indicator">
                    <div className="spinner"></div>
                    <span>Comparando con modelo...</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="stats-section">
          <TrainingStats 
            stats={sessionStats} 
            vowelProgress={vowelData}
          />
          
          <div className="instructions">
            <h3>Instrucciones para la Vocal {vowel.id}</h3>
            <ul>
              <li><strong>Seña:</strong> {vowel.description}</li>
              <li>Mantenga la mano estable frente a la cámara</li>
              <li>El sistema comparará automáticamente con el modelo</li>
              <li>Espere el resultado de la verificación</li>
            </ul>
            
            <div className="model-info">
              <h4>⚡ Estado del Modelo</h4>
              <p>{modelStatus}</p>
              <button 
                className="refresh-model-btn"
                onClick={handleRefreshModel}
                disabled={isComparing}
              >
                🔄 Actualizar Modelo
              </button>
              <p className="model-note">
                Si acabas de entrenar un nuevo modelo, haz clic en "Actualizar Modelo" 
                para asegurarte de que el frontend use la versión más reciente.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingView;