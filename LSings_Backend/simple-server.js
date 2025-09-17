import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const PORT = process.env.PORT || 5000;

// ✅ CONFIGURACIÓN CORS CORREGIDA - Permite múltiples puertos
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8080'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware para logging de requests (útil para debugging)
app.use((req, res, next) => {
    console.log(`📨 ${new Date().toISOString()} ${req.method} ${req.path}`);
    console.log(`   Origin: ${req.headers.origin}`);
    console.log(`   Host: ${req.headers.host}`);
    next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'dist')));

// Crear carpeta training_data si no existe
const dataDir = path.join(__dirname, 'training_data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// 1. Ruta para guardar datos de entrenamiento (CREATE)
app.post('/api/save-data', (req, res) => {
    try {
        const { vowel, data } = req.body;
        
        if (!vowel || !data) {
            return res.status(400).json({ 
                success: false, 
                error: 'Datos incompletos: se requiere vowel y data' 
            });
        }

        // Calcular tamaño de datos recibidos
        const receivedSize = JSON.stringify(req.body).length;
        console.log(`📦 Datos recibidos: ${receivedSize} bytes para vocal ${vowel}`);
        
        const filename = `vocal_${vowel}_${Date.now()}.json`;
        const filePath = path.join(dataDir, filename);
        
        const dataToSave = {
            vowel,
            totalFrames: data.length,
            frames: data,
            captureDate: new Date().toISOString(),
            maxFrames: 100,
            status: data.length >= 100 ? "COMPLETO" : "PARCIAL",
            dataSize: receivedSize
        };

        fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2));
        
        console.log(`✅ Datos guardados: ${filename} (${receivedSize} bytes)`);
        res.json({ 
            success: true, 
            message: `Datos de ${vowel} guardados correctamente`,
            filename: filename,
            size: receivedSize
        });
        
    } catch (error) {
        console.error('❌ Error al guardar:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// 2. Ruta para obtener todos los datos (READ)
app.get('/api/training-data', (req, res) => {
    try {
        if (!fs.existsSync(dataDir)) {
            return res.json({ 
                success: true, 
                files: [],
                message: 'No hay datos de entrenamiento aún'
            });
        }

        const files = fs.readdirSync(dataDir)
            .filter(file => file.endsWith('.json'))
            .map(file => {
                const filePath = path.join(dataDir, file);
                try {
                    const content = fs.readFileSync(filePath, 'utf8');
                    const data = JSON.parse(content);
                    return {
                        filename: file,
                        vowel: data.vowel,
                        totalFrames: data.totalFrames,
                        captureDate: data.captureDate,
                        status: data.status,
                        filePath: filePath
                    };
                } catch (error) {
                    console.error(`Error leyendo archivo ${file}:`, error);
                    return null;
                }
            })
            .filter(file => file !== null);

        res.json({ 
            success: true, 
            files: files,
            totalFiles: files.length
        });
        
    } catch (error) {
        console.error('❌ Error al leer datos:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// 3. Ruta para eliminar datos por vocal (DELETE)
app.delete('/api/delete-data/:vowel', (req, res) => {
    try {
        const { vowel } = req.params;
        
        if (!vowel) {
            return res.status(400).json({
                success: false,
                error: 'Se requiere el parámetro vowel'
            });
        }

        if (!fs.existsSync(dataDir)) {
            return res.json({ 
                success: true, 
                deleted: 0,
                message: 'No hay datos para eliminar'
            });
        }

        const files = fs.readdirSync(dataDir)
            .filter(file => file.includes(`vocal_${vowel}_`) && file.endsWith('.json'));

        let deletedCount = 0;
        let errors = [];

        files.forEach(file => {
            try {
                const filePath = path.join(dataDir, file);
                fs.unlinkSync(filePath);
                deletedCount++;
                console.log(`✅ Archivo eliminado: ${file}`);
            } catch (error) {
                errors.push(`Error eliminando ${file}: ${error.message}`);
            }
        });

        if (errors.length > 0) {
            console.error('❌ Errores al eliminar:', errors);
        }

        res.json({ 
            success: true, 
            message: `Eliminados ${deletedCount} archivos de la vocal ${vowel}`,
            deleted: deletedCount,
            errors: errors.length > 0 ? errors : undefined
        });
        
    } catch (error) {
        console.error('❌ Error al eliminar datos:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// 4. Ruta de salud del servidor (HEALTH CHECK)
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Servidor funcionando correctamente',
        timestamp: new Date().toISOString(),
        dataDirectory: dataDir,
        dataExists: fs.existsSync(dataDir)
    });
});

// 5. Servir React para rutas no-API
app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
        return next();
    }
    
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).json({
            success: false,
            error: 'Archivo index.html no encontrado. Ejecuta "npm run build" primero.'
        });
    }
});


// NUEVOS ENDPOINTS PARA ACTUALIZAR MODELO Y ENTRENAR (simulados)
// =================================================================
app.get('/api/model/version', (req, res) => {
    const modelVersion = {
        version: "1.0.0",
        lastUpdated: new Date().toISOString()
    };
    res.json(modelVersion);
});

app.post('/api/train-model', (req, res) => {
    console.log('Se recibió una solicitud para entrenar el modelo. (Esto es una simulación)');
    res.json({ success: true, message: 'La solicitud de entrenamiento se recibió correctamente.' });
});
// =================================================================

// Manejo de errores global
app.use((error, req, res, next) => {
    console.error('❌ Error global:', error);
    res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
    });
});
// Agrega esto después de la línea 180 (después del endpoint /api/train-model)

// 6. Endpoint de comparación para predicciones en tiempo real
app.post('/api/compare', (req, res) => {
    try {
        const { current_landmarks, target_vowel } = req.body;
        
        console.log(`🔍 Comparando landmarks para vocal: ${target_vowel}`);
        console.log(`   Landmarks recibidos: ${current_landmarks ? current_landmarks.length : 0} valores`);
        
        if (!current_landmarks || !target_vowel) {
            return res.status(400).json({
                success: false,
                error: 'Se requieren current_landmarks y target_vowel'
            });
        }

        // SIMULACIÓN DE PREDICCIÓN (reemplazar con modelo real después)
        const confidence = simulatePrediction(current_landmarks, target_vowel);
        const match = confidence > 70; // 70% de confianza para considerar match
        
        res.json({
            success: true,
            comparison: {
                match,
                confidence,
                timestamp: new Date().toISOString(),
                vowel: target_vowel,
                landmarks_count: current_landmarks.length
            }
        });

    } catch (error) {
        console.error('❌ Error en comparación:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno en comparación'
        });
    }
});

// Función de simulación de predicción (eliminar cuando tengas modelo real)
const simulatePrediction = (landmarks, targetVowel) => {
    if (!landmarks || landmarks.length < 63) return 0;
    
    // Simulación basada en patrones de landmarks para cada vocal
    let confidence = 50; // Base 50%
    
    // Lógica simple de simulación
    if (targetVowel === 'A') {
        // Para vocal A: pulgar extendido (landmark 4 arriba)
        if (landmarks[4] !== undefined && landmarks[2] !== undefined) {
            const thumbTipY = landmarks[4 * 3 + 1]; // y coordinate of thumb tip
            const thumbBaseY = landmarks[2 * 3 + 1]; // y coordinate of thumb base
            if (thumbTipY < thumbBaseY) confidence += 40; // Pulgar arriba
        }
    }
    // Agregar lógica para otras vocales aquí...
    
    // Asegurar que esté entre 0-100%
    return Math.min(100, Math.max(0, confidence + (Math.random() * 10 - 5)));
};

// Iniciar servidor
app.listen(PORT, () => {
    console.log('🚀' + '='.repeat(50));
    console.log(`🚀 Backend de Lenguaje_Sings ejecutándose`);
    console.log(`🚀 Puerto: ${PORT}`);
    console.log(`🚀 URL: http://localhost:${PORT}`);
    console.log(`📁 Datos guardados en: ${dataDir}`);
    console.log(`🌐 Frontends permitidos: http://localhost:3000, http://localhost:5173, http://localhost:8080`);
    console.log('🚀' + '='.repeat(50));
    console.log(`✅ Para verificar, visita: http://localhost:${PORT}/api/health`);
});

// Manejo elegante de cierre
process.on('SIGINT', () => {
    console.log('\n🛑 Cerrando servidor gracefully...');
    process.exit(0);
});