// hooks/useVowelComparison.js
import { useCallback, useRef, useState } from 'react';
import { compareWithModel, forceModelUpdate } from '../services/predictionService';

export const useVowelComparison = () => {
  const [isComparing, setIsComparing] = useState(false);
  const lastComparisonTime = useRef(0);
  const comparisonQueue = useRef([]);

  const compare = useCallback(async (landmarks, targetVowel, onResult) => {
    const now = Date.now();
    
    // DEBOUSE REDUCIDO: solo 1 comparación cada 300ms (antes 2000ms)
    if (now - lastComparisonTime.current < 300) {
      return;
    }

    // Si ya hay una comparación en proceso, encolar
    if (isComparing) {
      comparisonQueue.current.push({ landmarks, targetVowel, onResult });
      return;
    }

    setIsComparing(true);
    lastComparisonTime.current = now;

    try {
      const result = await compareWithModel(landmarks, targetVowel);
      
      if (onResult && result.success) {
        onResult(result.comparison);
      } else if (result.error) {
        console.error('Error del backend:', result.error);
        // Podemos forzar actualización si hay error
        if (result.error.includes('modelo') || result.error.includes('version')) {
          await forceModelUpdate();
        }
      }

    } catch (error) {
      console.error('Error en comparación:', error);
    } finally {
      setIsComparing(false);
      
      // Procesar siguiente en la cola
      if (comparisonQueue.current.length > 0) {
        const next = comparisonQueue.current.shift();
        setTimeout(() => compare(next.landmarks, next.targetVowel, next.onResult), 100);
      }
    }
  }, [isComparing]);

  // Función para forzar actualización manual
  const refreshModel = useCallback(async () => {
    return await forceModelUpdate();
  }, []);

  return { compare, isComparing, refreshModel };
};