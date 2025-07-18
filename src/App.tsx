// src/App.tsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { FloorPlan } from './FloorPlan';
import { UnitPopup } from './UnitPopup';
import { Legend } from './Legend';
import { EditToggle } from './EditToggle';
import { AddUnitModal } from './AddUnitModal';
import type { Unit, PopupPosition, MapData, ColorMap } from './types';

interface LegendData {
    usedUnitTypes: string[];
    colors: ColorMap;
}

function App() {
    const [mapData, setMapData] = useState<MapData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    
    const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
    const [popupPosition, setPopupPosition] = useState<PopupPosition | null>(null);
    const [legendData, setLegendData] = useState<LegendData | null>(null);
    const [structureData, setStructureData] = useState<MapData | null>(null);
    
    const [isEditMode, setIsEditMode] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // 1. Загрузка данных
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const response = await fetch('/map.json');
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const jsonData: MapData = await response.json();
                setMapData(jsonData);
            } catch (e) {
                setError(e as Error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    // 2. Функции для отправки команд в iframe
    const postMessageToIframe = useCallback((message: object) => {
        iframeRef.current?.contentWindow?.postMessage(message, '*');
    }, []);

    // 3. Обработчик закрытия попапа
    const handleClosePopup = useCallback(() => {
        setSelectedUnit(null);
        postMessageToIframe({ type: 'DESELECT_ALL' });
    }, [postMessageToIframe]);

    // 4. Прослушивание сообщений от iframe
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const { type, payload } = event.data;
            if (type === 'UNIT_CLICK') {
                setSelectedUnit(payload.unit);
                setPopupPosition(payload.position);
            } else if (type === 'STAGE_CLICK') {
                handleClosePopup(); // Используем наш централизованный обработчик
            } else if (type === 'DATA_PROCESSED') {
                setLegendData(payload.legend);
                setStructureData(payload.structure);
            } else if (type === 'UPDATED_DATA_JSON') {
                console.log("Получен обновленный JSON из iframe:", payload);
                alert("Обновленный JSON выведен в консоль!");
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [handleClosePopup]); // Добавляем зависимость

    const handleResetView = () => postMessageToIframe({ type: 'RESET_VIEW' });

    const handleSaveUnit = useCallback((unitId: string, newData: { label: string; unitType: string }) => {
        postMessageToIframe({ type: 'UPDATE_UNIT', payload: { id: unitId, newData } });
    }, [postMessageToIframe]);

    const handleSaveChanges = () => postMessageToIframe({ type: 'GET_DATA_AS_JSON' });
    
    const handleAddUnit = useCallback((newData: { sectionName: string; floorName: string; label: string; unitType: string }) => {
        postMessageToIframe({ type: 'ADD_UNIT', payload: newData });
    }, [postMessageToIframe]);

    const handleDeleteUnit = useCallback(() => {
        if (selectedUnit) {
            if (window.confirm(`Вы уверены, что хотите удалить помещение №${selectedUnit.label}?`)) {
                postMessageToIframe({ type: 'DELETE_UNIT', payload: { id: selectedUnit.id } });
                handleClosePopup();
            }
        }
    }, [selectedUnit, postMessageToIframe, handleClosePopup]);

    const toggleEditMode = () => {
        setIsEditMode(prev => !prev);
        if (isEditMode) handleClosePopup();
    };

    return (
        <div className="app-container">
            <div className="controls">
                <EditToggle isEditMode={isEditMode} onToggle={toggleEditMode} />
                <button onClick={handleResetView}>Сбросить вид</button>
                {isEditMode && (
                    <>
                        <button onClick={() => setIsModalOpen(true)} style={{ backgroundColor: '#17a2b8', borderColor: '#17a2b8' }}>
                            Добавить помещение
                        </button>
                        <button onClick={handleDeleteUnit} disabled={!selectedUnit} style={{ backgroundColor: '#dc3545', borderColor: '#dc3545' }}>
                            Удалить выбранное
                        </button>
                        <button onClick={handleSaveChanges} style={{ backgroundColor: '#28a745', borderColor: '#28a745' }}>
                            Сохранить схему
                        </button>
                    </>
                )}
            </div>

            <div className="floor-plan-wrapper">
                {isLoading && <div className="loading-spinner">Загрузка данных...</div>}
                {error && <div className="error-message">Ошибка: {error.message}</div>}
                {!isLoading && !error && (
                    <FloorPlan data={mapData} iframeRef={iframeRef} />
                )}
                <Legend data={legendData} />
                <UnitPopup
                    unit={selectedUnit}
                    position={popupPosition}
                    isEditMode={isEditMode}
                    onClose={handleClosePopup}
                    onSave={handleSaveUnit}
                />
                <AddUnitModal
                    isOpen={isModalOpen}
                    structure={structureData}
                    onClose={() => setIsModalOpen(false)}
                    onAdd={handleAddUnit}
                />
            </div>
        </div>
    );
}

export default App;
