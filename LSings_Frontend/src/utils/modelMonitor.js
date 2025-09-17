// src/utils/modelMonitor.js
const API_URL = import.meta.env.PROD
  ? "https://tu-backend.railway.app"
  : "http://localhost:5000";

const modelMonitor = {
  updateModel: async () => {
    try {
      const res = await fetch(`${API_URL}/update-model`, { method: "POST" });
      if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error("❌ Error en updateModel:", err);
      return { success: false, error: err.message };
    }
  },

  // 👇 estas dos funciones deben existir
  startAutoMonitoring: () => {
    console.log("📡 Monitoreo automático iniciado");
  },

  stopAutoMonitoring: () => {
    console.log("🛑 Monitoreo automático detenido");
  }
};

export default modelMonitor;
