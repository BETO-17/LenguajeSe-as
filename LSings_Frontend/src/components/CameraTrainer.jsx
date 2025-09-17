import React, { useRef, useEffect, useCallback } from 'react';
import { initializeHands } from '../../../LSings_Backend/src/utils/mediaPipeUtils';
import '../styles.css'; // Importar los nuevos estilos

const CameraTrainer = ({ isCapturing, onFrameCaptured }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const handsRef = useRef(null);

    const onResults = useCallback((results) => {
        if (!canvasRef.current || !videoRef.current) return;
        
        const canvasCtx = canvasRef.current.getContext('2d');
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        
        // Dibujar el video en el canvas (espejado horizontalmente)
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.scale(-1, 1); // espejo horizontal
        ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
        ctx.restore();

        // Dibujar landmarks y conexiones sobre el video
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const handLandmarks = results.multiHandLandmarks[0];

            // Espejar el contexto para que los landmarks coincidan con el video
            ctx.save();
            ctx.scale(-1, 1);
            ctx.translate(-canvas.width, 0);

            if (window.drawConnectors && window.drawLandmarks) {
                window.drawConnectors(ctx, handLandmarks, window.HAND_CONNECTIONS, { 
                    color: '#00FF00', 
                    lineWidth: 4 
                });
                window.drawLandmarks(ctx, handLandmarks, { 
                    color: '#FF0000', 
                    lineWidth: 2,
                    radius: 3 
                });
            }

            ctx.restore();

            if (isCapturing) {
                const flattenedLandmarks = handLandmarks.flatMap(lm => [lm.x, lm.y, lm.z]);
                onFrameCaptured(flattenedLandmarks);
            }
        }
    }, [isCapturing, onFrameCaptured]);

    useEffect(() => {
        handsRef.current = initializeHands(onResults);

        if (videoRef.current && window.Camera) {
            const camera = new window.Camera(videoRef.current, {
                onFrame: async () => {
                    if (videoRef.current && handsRef.current) {
                        await handsRef.current.send({ image: videoRef.current });
                    }
                },
                width: 640,
                height: 480,
            });
            camera.start();
        }
    }, [onResults]);

    return (
        <div className="compact-camera">
            <h3 className="compact-title">📷 Cámara de Entrenamiento</h3>
            <div className="camera-container">
                <video
                    ref={videoRef}
                    width="640"
                    height="480"
                    style={{ display: 'none' }}
                    playsInline
                    muted
                    autoPlay
                ></video>
                <canvas 
                    ref={canvasRef} 
                    width="640" 
                    height="480"
                ></canvas>
            </div>
            <div className="mt-2 text-center">
                <span className="text-sm text-cyan-300">
                    {isCapturing ? '● Grabando...' : 'Pausado'}
                </span>
            </div>
        </div>
    );
};

export default CameraTrainer;