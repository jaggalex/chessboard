// src/UnitPopup.tsx
import React, { useState, useEffect } from 'react';
import './UnitPopup.css';
import type { Unit, PopupPosition } from './types';
import { unitTypeTranslations, getUnitTypeTranslation } from './translations';

interface UnitPopupProps {
    unit: Unit | null;
    position: PopupPosition | null;
    isEditMode: boolean;
    onClose: () => void;
    onSave: (unitId: string, newData: { label: string; unitType: string }) => void;
}

export const UnitPopup: React.FC<UnitPopupProps> = ({ unit, position, isEditMode, onClose, onSave }) => {
    const [label, setLabel] = useState('');
    const [unitType, setUnitType] = useState('');

    useEffect(() => {
        if (unit) {
            setLabel(unit.label);
            setUnitType(unit.unitType);
        }
    }, [unit]);

    if (!unit || !position) return null;

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(unit.id, { label, unitType });
        onClose();
    };

    return (
        <div className="unit-popup" style={{ left: position.x, top: position.y }}>
            <button className="close-button" onClick={onClose}>×</button>
            
            {isEditMode ? (
                <>
                    <h3>Редактирование</h3>
                    <form onSubmit={handleSave}>
                        <div className="form-group">
                            <label htmlFor="unit-label">Номер:</label>
                            <input
                                id="unit-label"
                                type="text"
                                value={label}
                                onChange={(e) => setLabel(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="unit-type">Тип:</label>
                            <select
                                id="unit-type"
                                value={unitType}
                                onChange={(e) => setUnitType(e.target.value)}
                            >
                                {Object.entries(unitTypeTranslations).map(([key, value]) => (
                                    <option key={key} value={key}>{value}</option>
                                ))}
                            </select>
                        </div>
                        <button type="submit" className="save-button">Применить</button>
                    </form>
                </>
            ) : (
                <>
                    <h3>Помещение №{unit.label}</h3>
                    <p><strong>ID:</strong> {unit.id}</p>
                    <p><strong>Тип:</strong> {getUnitTypeTranslation(unit.unitType)}</p>
                </>
            )}
        </div>
    );
};