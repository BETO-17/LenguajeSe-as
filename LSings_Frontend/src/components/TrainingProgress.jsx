import React from 'react';
import '../styles.css';

const TrainingProgress = ({
    vowels, maxFrames, selectedVowel, capturedData, serverData, isCapturing,
    onSelectVowel, onToggleCapture, onDeleteData, onFinalize
}) => {

    const countServerFiles = (vowel) => {
        return Array.isArray(serverData) ? serverData.filter(file => file && file.vowel === vowel).length : 0;
    };

    const getServerTotalFrames = (vowel) => {
        return Array.isArray(serverData) ? 
            serverData.filter(file => file && file.vowel === vowel)
                .reduce((total, file) => total + (file.totalFrames || 0), 0) : 0;
    };

    const currentFramesCount = selectedVowel ? (capturedData[selectedVowel] || []).length : 0;

    return (
        <div className="control-panel">
            {/* Selección de vocal */}
            <div className="panel-section">
                <h3 className="section-title">🎯 Selecciona Vocal</h3>
                <div className="vowels-grid">
                    {vowels.map(vowel => (
                        <button 
                            key={vowel} 
                            onClick={() => onSelectVowel(vowel)}
                            className={`vowel-btn ${selectedVowel === vowel ? 'selected' : ''}`}
                        >
                            {vowel}
                        </button>
                    ))}
                </div>
            </div>

            {/* Control de grabación */}
            <div className="panel-section">
                <h3 className="section-title">⏺️ Control</h3>
                <div className="control-buttons">
                    <button
                        onClick={onToggleCapture}
                        disabled={!selectedVowel || currentFramesCount >= maxFrames}
                        className={`record-btn ${isCapturing ? 'recording' : ''}`}
                    >
                        {isCapturing ? '⏸️ Pausar' : '▶️ Grabar'}
                    </button>
                    
                    <div className="status-text">
                        {selectedVowel ? 
                            `Grabando: ${selectedVowel} | ${currentFramesCount}/${maxFrames} frames` : 
                            "Selecciona una vocal"}
                    </div>
                    {currentFramesCount >= maxFrames && selectedVowel && (
                        <div className="completed-text">¡Completado! ✓</div>
                    )}
                </div>
            </div>

            {/* Progreso */}
            <div className="panel-section">
                <h3 className="section-title">📊 Progreso</h3>
                <div className="progress-container">
                    {vowels.map(vowel => {
                        const localFrames = (capturedData[vowel] || []).length;
                        const progress = (localFrames / maxFrames) * 100;
                        
                        return (
                            <div key={vowel} className="progress-item">
                                <div className="progress-text">
                                    Vocal {vowel}: {localFrames}/{maxFrames}
                                </div>
                                <div className="progress-bar">
                                    <div 
                                        className="progress-fill" 
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Gestión de datos */}
            <div className="panel-section">
                <h3 className="section-title">🗃️ Datos</h3>
                <div className="data-container">
                    {vowels.map(vowel => {
                        const localFrames = (capturedData[vowel] || []).length;
                        const serverFiles = countServerFiles(vowel);
                        const serverFrames = getServerTotalFrames(vowel);
                        
                        return (
                            <div key={vowel} className="data-item">
                                <div className="data-info">
                                    <div className="data-title">
                                        {vowel}: {localFrames} frames
                                    </div>
                                    <div className="data-subtitle">
                                        Servidor: {serverFiles} archivos ({serverFrames} frames)
                                    </div>
                                </div>
                                <button 
                                    onClick={() => onDeleteData(vowel)} 
                                    className="delete-btn"
                                    title="Eliminar datos"
                                >
                                    🗑️
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Acciones */}
            <div className="panel-section">
                <h3 className="section-title">⚡ Acciones</h3>
                <div className="action-buttons">
                    <button 
                        onClick={onFinalize} 
                        className="action-btn"
                        disabled={Object.keys(capturedData).length === 0}
                    >
                        💾 Guardar en Servidor
                    </button>
                    
                    <button 
                        onClick={() => {
                            const dataStr = JSON.stringify(capturedData, null, 2);
                            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
                            const fileName = `backup_${new Date().toISOString().slice(0, 10)}.json`;
                            
                            const link = document.createElement('a');
                            link.setAttribute('href', dataUri);
                            link.setAttribute('download', fileName);
                            link.style.display = 'none';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        }} 
                        className="action-btn"
                        disabled={Object.keys(capturedData).length === 0}
                    >
                        📥 Descargar Backup
                    </button>
                </div>
            </div>

            {/* Estadísticas */}
            <div className="panel-section">
                <h3 className="section-title">📈 Estadísticas</h3>
                <div className="stats-grid">
                    <div className="stat-box">
                        <div className="stat-number">
                            {Object.keys(capturedData).filter(v => capturedData[v]?.length > 0).length}
                        </div>
                        <div className="stat-label">Vocales activas</div>
                    </div>
                    <div className="stat-box">
                        <div className="stat-number">
                            {Object.values(capturedData).reduce((total, frames) => total + frames.length, 0)}
                        </div>
                        <div className="stat-label">Frames totales</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrainingProgress;