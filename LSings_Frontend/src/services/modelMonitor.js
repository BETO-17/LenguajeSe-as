// services/modelMonitor.js
import api from './api';

class ModelMonitor {
  constructor() {
    this.currentVersion = null;
    this.lastCheck = 0;
    this.checkInterval = 30000; // 30 segundos
    this.subscribers = [];
    this.isChecking = false;
  }

  // Suscribirse a cambios del modelo
  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  // Notificar a todos los suscriptores
  notifySubscribers(newVersion) {
    this.subscribers.forEach(callback => {
      try {
        callback(newVersion);
      } catch (error) {
        console.error('Error en subscriber:', error);
      }
    });
  }

  // Verificar la versión del modelo
  async checkModelVersion() {
    if (this.isChecking) return;
    
    this.isChecking = true;
    try {
      const now = Date.now();
      if (now - this.lastCheck < this.checkInterval) {
        return;
      }

      this.lastCheck = now;
      
      const response = await api.get('/model/version', {
        timeout: 5000
      });

      if (response.data.success) {
        const newVersion = response.data.version;
        
        if (this.currentVersion === null) {
          // Primera vez
          this.currentVersion = newVersion;
          console.log('✅ Modelo inicial cargado:', newVersion);
        } else if (this.currentVersion !== newVersion) {
          // ¡Modelo actualizado!
          console.log('🔄 Modelo actualizado:', this.currentVersion, '→', newVersion);
          this.currentVersion = newVersion;
          this.notifySubscribers(newVersion);
          
          // Limpiar caches
          this.clearCaches();
        }
      }
    } catch (error) {
      console.log('⚠️ No se pudo verificar versión del modelo:', error.message);
    } finally {
      this.isChecking = false;
    }
  }

  // Limpiar caches locales
  clearCaches() {
    // Limpiar localStorage
    localStorage.removeItem('predictionCache');
    localStorage.removeItem('modelData');
    
    // Limpiar sessionStorage
    sessionStorage.removeItem('tempPredictions');
    
    console.log('🧹 Caches limpiados por actualización de modelo');
  }

  // Iniciar monitoreo automático
  startAutoMonitoring() {
    console.log('🔍 Iniciando monitoreo automático del modelo...');
    
    // Verificar inmediatamente
    this.checkModelVersion();
    
    // Verificar periódicamente
    this.intervalId = setInterval(() => {
      this.checkModelVersion();
    }, this.checkInterval);
  }

  // Detener monitoreo
  stopAutoMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      console.log('🛑 Monitoreo automático detenido');
    }
  }

  // Obtener versión actual
  getCurrentVersion() {
    return this.currentVersion;
  }

  // Forzar verificación inmediata
  async forceCheck() {
    this.lastCheck = 0;
    return await this.checkModelVersion();
  }
}

// Instancia global del monitor
export const modelMonitor = new ModelMonitor();