import api from './api';

export const getTrainingData = async () => {
  try {
    console.log('🔄 Intentando conectar con el backend...');
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    
    const response = await api.get('/training-data');
    
    if (response.data.success) {
      return response.data;
    } else {
      // Backend responde pero sin datos
      return {
        success: true,
        files: [],
        totalFiles: 0,
        message: "No hay datos de entrenamiento"
      };
    }
  } catch (error) {
    console.error('❌ Error conectando con el backend:', error.message);
    
    // DATOS VACÍOS en lugar de ejemplos
    return {
      success: false,
      error: error.message,
      message: "Backend no disponible",
      files: [],
      totalFiles: 0
    };
  }
};

export const getUserProgress = async () => {
  try {
    const trainingData = await getTrainingData();
    
    const vowels = ['A', 'E', 'I', 'O', 'U'];
    const vowelProgress = {};
    
    // Inicializar con ceros
    vowels.forEach(vowel => {
      vowelProgress[vowel] = {
        mastered: false,
        accuracy: 0,
        sessions: 0,
        totalFrames: 0
      };
    });
    
    // Solo actualizar si hay datos reales
    if (trainingData.files && trainingData.files.length > 0) {
      vowels.forEach(vowel => {
        const vowelFiles = trainingData.files.filter(file => file.vowel === vowel);
        const totalFrames = vowelFiles.reduce((sum, file) => sum + (file.totalFrames || 0), 0);
        
        if (vowelFiles.length > 0) {
          vowelProgress[vowel] = {
            mastered: totalFrames >= 300,
            accuracy: Math.min(100, Math.floor((totalFrames / 500) * 100)), // % real
            sessions: vowelFiles.length,
            totalFrames: totalFrames
          };
        }
      });
    }
    
    const completed = Object.values(vowelProgress).filter(v => v.mastered).length;
    const totalSessions = Object.values(vowelProgress).reduce((sum, v) => sum + v.sessions, 0);
    const totalFrames = Object.values(vowelProgress).reduce((sum, v) => sum + v.totalFrames, 0);
    
    // Calcular precisión promedio solo si hay datos
    const accuracies = Object.values(vowelProgress).map(v => v.accuracy);
    const avgAccuracy = accuracies.length > 0 ? accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length : 0;
    
    return {
      completed,
      total: vowels.length,
      accuracy: avgAccuracy.toFixed(1),
      sessions: totalSessions,
      totalTime: Math.floor(totalFrames / 10), // Estimación más realista
      masteredVowels: vowels.filter(v => vowelProgress[v].mastered),
      vowelProgress
    };
  } catch (error) {
    console.error('Error getting user progress:', error);
    
    // Devolver datos vacíos
    const vowels = ['A', 'E', 'I', 'O', 'U'];
    const vowelProgress = {};
    
    vowels.forEach(vowel => {
      vowelProgress[vowel] = {
        mastered: false,
        accuracy: 0,
        sessions: 0,
        totalFrames: 0
      };
    });
    
    return {
      completed: 0,
      total: 5,
      accuracy: 0,
      sessions: 0,
      totalTime: 0,
      masteredVowels: [],
      vowelProgress
    };
  }
};

export const getRecentSessions = async () => {
  try {
    const trainingData = await getTrainingData();
    
    if (!trainingData.files || trainingData.files.length === 0) {
      return [];
    }
    
    const recentFiles = trainingData.files
      .sort((a, b) => new Date(b.captureDate) - new Date(a.captureDate))
      .slice(0, 5);
    
    return recentFiles.map(file => ({
      vowel: file.vowel,
      time: formatTimeSince(new Date(file.captureDate)),
      frames: file.totalFrames || 0,
      date: file.captureDate
    }));
  } catch (error) {
    console.error('Error getting recent sessions:', error);
    return [];
  }
};

// Función auxiliar para formatear tiempo transcurrido
const formatTimeSince = (date) => {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffDays > 0) return `${diffDays}d`;
  if (diffHours > 0) return `${diffHours}h`;
  return `${diffMins}m`;
};

export const saveTrainingSession = async (sessionData) => {
  try {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    
    const response = await fetch(`${API_URL}/save-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vowel: sessionData.vowel,
        data: [sessionData.landmarks],
        correct: sessionData.correct,
        confidence: sessionData.confidence,
        timestamp: sessionData.timestamp
      })
    });

    if (!response.ok) throw new Error('Error saving training data');
    
    return await response.json();
  } catch (error) {
    console.error('Error saving training session:', error);
    // En desarrollo, podemos simular éxito pero sin datos falsos
    return { 
      success: false, 
      message: 'Error guardando datos. Intenta nuevamente.' 
    };
  }
};