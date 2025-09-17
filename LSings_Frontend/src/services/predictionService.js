// services/predictionService.js
import api from './api';

// Variable global para controlar la versión del modelo
let modelVersion = 0;
let lastModelCheck = 0;

// Cache para evitar llamadas redundantes
const predictionCache = new Map();
const CACHE_DURATION = 1000; // 1 segundo de cache

export const compareWithModel = async (landmarks, targetVowel) => {
  try {
    console.log('🔄 Enviando a /api/compare:', {
      vowel: targetVowel,
      landmarks_count: landmarks.length
    });
    
    const response = await api.post('/compare', {
      current_landmarks: landmarks,
      target_vowel: targetVowel,
      timestamp: Date.now(),
      model_version: modelVersion
    });

    console.log('✅ Respuesta del backend:', response.data);
    return response.data;

  } catch (error) {
    console.error('❌ Error en comparación:', error.response?.data || error.message);
    return {
      success: false,
      error: 'Error de conexión con el backend',
      comparison: null
    };
  }
};

// ... (el resto del archivo se mantiene igual)
export const getModelInfo = async () => {
  try {
    const response = await api.get('/model/info');
    if (response.data.version) {
      modelVersion = response.data.version;
    }
    return response.data;
  } catch (error) {
    console.error('Error obteniendo info del modelo:', error);
    return {
      success: false,
      message: "Modelo no disponible"
    };
  }
};

export const forceModelUpdate = async () => {
  try {
    const response = await api.get('/model/refresh');
    modelVersion = response.data.version;
    lastModelCheck = Date.now();
    predictionCache.clear(); // Limpiar cache al forzar actualización
    console.log('🔄 Modelo forzado a actualizar:', modelVersion);
    return true;
  } catch (error) {
    console.error('Error forzando actualización:', error);
    return false;
  }
};
