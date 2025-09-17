import React, { useRef, useEffect, useCallback } from 'react';
import { useMediaPipe } from '../../hooks/useMediaPipe';
import './CameraFeed.css';

const CameraFeed = ({ 
  isCapturing, 
  onLandmarksDetected  // ← CAMBIADO: onFrameCaptured por onLandmarksDetected
}) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const { hands, isLoaded, landmarks, error } = useMediaPipe();
  const streamRef = useRef(null);
  const animationRef = useRef(null);

  // Inicializar cámara
  const startCamera = useCallback(async () => {
    try {
      console.log('🔄 Iniciando cámara...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // Esperar a que el video esté listo
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          console.log('✅ Cámara iniciada correctamente');
        };
      }

    } catch (error) {
      console.error('❌ Error accediendo a la cámara:', error);
    }
  }, []);

  // Detener cámara
  const stopCamera = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    console.log('🛑 Cámara detenida');
  }, []);

  // Procesar frames con MediaPipe
  useEffect(() => {
    let intervalId = null;

    const processFrame = async () => {
      if (isCapturing && videoRef.current && hands && videoRef.current.readyState === 4) {
        try {
          await hands.send({ image: videoRef.current });
        } catch (error) {
          console.error('Error procesando frame:', error);
        }
      }
    };

    if (isCapturing && isLoaded) {
      intervalId = setInterval(processFrame, 300); // 300ms = ~3 FPS
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isCapturing, hands, isLoaded]);

  // Dibujar video y landmarks en canvas
  useEffect(() => {
    const draw = () => {
      if (videoRef.current && canvasRef.current && videoRef.current.readyState === 4) {
        const ctx = canvasRef.current.getContext('2d');
        const video = videoRef.current;
        const canvas = canvasRef.current;

        // Limpiar canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Dibujar video (espejado)
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
        ctx.restore();

        // Dibujar landmarks si existen
        if (landmarks && landmarks.length >= 63) { // 21 puntos * 3 coordenadas
          ctx.save();
          ctx.scale(-1, 1);
          ctx.translate(-canvas.width, 0);

          // Convertir landmarks a puntos dibujables
          const points = [];
          for (let i = 0; i < 21; i++) {
            points.push({
              x: landmarks[i * 3] * canvas.width,
              y: landmarks[i * 3 + 1] * canvas.height
            });
          }

          // Dibujar conexiones manualmente
          ctx.strokeStyle = '#00FF00';
          ctx.lineWidth = 3;
          
          // Conexiones básicas de la mano
          const connections = [
            [0, 1], [1, 2], [2, 3], [3, 4],       // Pulgar
            [0, 5], [5, 6], [6, 7], [7, 8],       // Índice
            [0, 9], [9, 10], [10, 11], [11, 12],  // Medio
            [0, 13], [13, 14], [14, 15], [15, 16], // Anular
            [0, 17], [17, 18], [18, 19], [19, 20]  // Meñique
          ];

          connections.forEach(([start, end]) => {
            if (points[start] && points[end]) {
              ctx.beginPath();
              ctx.moveTo(points[start].x, points[start].y);
              ctx.lineTo(points[end].x, points[end].y);
              ctx.stroke();
            }
          });

          // Dibujar puntos
          ctx.fillStyle = '#FF0000';
          points.forEach(point => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
            ctx.fill();
          });

          ctx.restore();
        }
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    if (isCapturing) {
      draw();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isCapturing, landmarks]);

  // ✅ NOTIFICAR LANDMARKS DETECTADOS - ESTA ES LA PARTE IMPORTANTE
  useEffect(() => {
    if (onLandmarksDetected) {
      onLandmarksDetected(landmarks);
    }
  }, [landmarks, onLandmarksDetected]); // ← Se ejecuta cuando hay nuevos landmarks

  // Manejar inicio/detención de cámara
  useEffect(() => {
    if (isCapturing) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [isCapturing, startCamera, stopCamera]);

  return (
    <div className="camera-feed">
      <div className="camera-container">
        <video
          ref={videoRef}
          style={{ display: 'none' }}
          playsInline
          muted
        />
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className="camera-canvas"
        />
        
        <div className="camera-overlay">
          <div className="hand-guide">
            <p>Mantenga su mano estable dentro del marco</p>
            {!landmarks && !error && (
              <p className="no-hands">⚠️ No se detectan manos</p>
            )}
            {landmarks && (
              <p className="hands-detected">✅ Mano detectada</p>
            )}
            {error && (
              <p className="error-text">❌ {error}</p>
            )}
          </div>
        </div>
      </div>

      <div className="camera-status">
        {!isLoaded && !error && <p>🔄 Cargando MediaPipe...</p>}
        {isLoaded && !landmarks && !error && <p>📷 Acerca tu mano a la cámara</p>}
        {isLoaded && landmarks && <p>✅ Mano detectada - Listo para comparar</p>}
        {error && <p className="error-text">❌ {error}</p>}
      </div>

      {/* Información de depuración (opcional) */}
      <div style={{ fontSize: '12px', color: '#666', marginTop: '10px', textAlign: 'center' }}>
        <p>Estado: {isLoaded ? 'Cargado' : 'Cargando...'}</p>
        <p>Landmarks: {landmarks ? (landmarks.length / 3) + ' puntos' : 'Ninguno'}</p>
        <p>Cámara: {isCapturing ? 'Activa' : 'Inactiva'}</p>
      </div>
    </div>
  );
};

export default CameraFeed;