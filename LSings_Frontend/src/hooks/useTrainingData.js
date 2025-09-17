import { useState, useEffect } from 'react';
import { getUserProgress, getRecentSessions } from '../services/trainingData';

export const useTrainingData = () => {
  const [userProgress, setUserProgress] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [progress, sessions] = await Promise.all([
          getUserProgress(),
          getRecentSessions()
        ]);
        
        setUserProgress(progress);
        setRecentSessions(sessions);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching training data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return { userProgress, recentSessions, loading, error };
};