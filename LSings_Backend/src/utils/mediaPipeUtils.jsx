/**
 * Inicializa y configura la instancia de MediaPipe Hands.
 * @param {function} onResultsCallback - La función que se ejecutará cuando se detecten manos.
 * @returns {Hands} La instancia de Hands configurada.
 */
export const initializeHands = (onResultsCallback) => {
    if (window.Hands) {
        const hands = new window.Hands({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });

        hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
        });

        hands.onResults(onResultsCallback);
        return hands;
    }
    console.error("MediaPipe Hands script not loaded or available on window object.");
    return null;
};