import { useState, useCallback } from 'react';
import api from '../services/api';

export const usePredictions = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);

  const getPrediction = useCallback(async (imageData, vowel) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // CONEXIÓN REAL con el backend
      const response = await api.post('/predict', { 
        image: imageData, 
        vowel 
      });
      
      setPrediction(response.data.prediction);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Error de predicción';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getPredictionHistory = useCallback(async (userId) => {
    try {
      const response = await api.get(`/predictions/history/${userId}`);
      return response.data;
    } catch (err) {
      console.error('Error fetching prediction history:', err);
      throw err;
    }
  }, []);

  const clearPrediction = useCallback(() => {
    setPrediction(null);
    setError(null);
  }, []);

  const savePredictionSession = useCallback(async (sessionData) => {
    try {
      const response = await api.post('/predictions/session', sessionData);
      return response.data;
    } catch (err) {
      console.error('Error saving prediction session:', err);
      throw err;
    }
  }, []);

  return {
    isLoading,
    prediction,
    error,
    getPrediction,
    getPredictionHistory,
    clearPrediction,
    savePredictionSession
  };
};