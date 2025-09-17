import { useState, useEffect } from 'react';

export const useMediaPipe = () => {
  const [hands, setHands] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [landmarks, setLandmarks] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeMediaPipe = () => {
      // Verificar si los scripts están cargados
      if (!window.Hands) {
        setError('MediaPipe no está cargado. Recarga la página.');
        return;
      }

      try {
        console.log('🔄 Inicializando MediaPipe Hands...');
        
        const hands = new window.Hands({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        hands.onResults((results) => {
          if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const handLandmarks = results.multiHandLandmarks[0];
            const flattenedLandmarks = handLandmarks.flatMap(lm => [lm.x, lm.y, lm.z]);
            setLandmarks(flattenedLandmarks);
          } else {
            setLandmarks(null);
          }
        });

        setHands(hands);
        setIsLoaded(true);
        setError(null);
        console.log('✅ MediaPipe Hands inicializado correctamente');

      } catch (err) {
        console.error('❌ Error inicializando MediaPipe:', err);
        setError('Error inicializando detección de manos: ' + err.message);
      }
    };

    // Esperar a que los scripts estén cargados
    const checkScriptsLoaded = () => {
      if (window.Hands) {
        initializeMediaPipe();
      } else {
        // Reintentar después de 1 segundo
        setTimeout(checkScriptsLoaded, 1000);
      }
    };

    checkScriptsLoaded();

  }, []);

  return { hands, isLoaded, landmarks, error };
};