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

    // 3. Обработчики
    const handleClosePopup = useCallback(() => {
        setPopupPosition(null); // Закрываем попап
        // selectedUnit не сбрасываем, чтобы выделение осталось
    }, []);

    const handleDeselectAll = useCallback(() => {
        setSelectedUnit(null);
        setPopupPosition(null);
        postMessageToIframe({ type: 'DESELECT_ALL' });
    }, [postMessageToIframe]);

    // 4. Прослушивание сообщений от iframe
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const { type, payload } = event.data;
            switch (type) {
                case 'UNIT_CLICK':
                    setSelectedUnit(payload.unit);
                    break;
                case 'UNIT_DBL_CLICK':
                    setSelectedUnit(payload.unit);
                    setPopupPosition(payload.position);
                    break;
                case 'STAGE_CLICK':
                    handleDeselectAll();
                    break;
                case 'DATA_PROCESSED':
                    setLegendData(payload.legend);
                    setStructureData(payload.structure);
                    break;
                case 'UPDATED_DATA_JSON':
                    console.log("Получен обновленный JSON из iframe:", payload);
                    alert("Обновленный JSON выведен в консоль!");
                    break;
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [handleDeselectAll]);

    // 5. Управление видимостью попапа для блокировки навигации в iframe
    useEffect(() => {
        postMessageToIframe({ type: 'SET_POPUP_VISIBILITY', payload: { isVisible: popupPosition !== null } });
    }, [popupPosition, postMessageToIframe]);


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
                handleDeselectAll();
            }
        }
    }, [selectedUnit, postMessageToIframe, handleDeselectAll]);

    const toggleEditMode = () => {
        setIsEditMode(prev => !prev);
        if (isEditMode) handleDeselectAll();
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