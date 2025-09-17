const STORAGE_KEY = 'sign_language_data';

/**
 * Guarda los datos de entrenamiento en el Local Storage.
 * @param {object} data - El objeto con los datos de los fotogramas (ya comprimidos).
 */
export const saveTrainingData = (data) => {
    try {
        const dataStr = JSON.stringify(data);
        localStorage.setItem(STORAGE_KEY, dataStr);
    } catch (error) {
        console.error("Error al guardar datos en Local Storage:", error);
    }
};

/**
 * Carga los datos de entrenamiento desde el Local Storage.
 * @returns {object} El objeto con los datos de los fotogramas (comprimidos), o un objeto vacío si no hay datos.
 */
export const loadTrainingData = () => {
    try {
        const dataStr = localStorage.getItem(STORAGE_KEY);
        return dataStr ? JSON.parse(dataStr) : {};
    } catch (error) {
        console.error("Error al cargar datos desde Local Storage:", error);
        return {};
    }
};

