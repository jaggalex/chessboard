// src/AddUnitModal.tsx
import React, { useState } from 'react';
import type { MapData } from './types';
import { unitTypeTranslations } from './translations';
import './AddUnitModal.css';

interface AddUnitModalProps {
    isOpen: boolean;
    structure: MapData | null;
    onClose: () => void;
    onAdd: (newData: { sectionName: string; floorName: string; label: string; unitType: string }) => void;
}

export const AddUnitModal: React.FC<AddUnitModalProps> = ({ isOpen, structure, onClose, onAdd }) => {
    const [sectionName, setSectionName] = useState('');
    const [floorName, setFloorName] = useState('');
    const [label, setLabel] = useState('');
    const [unitType, setUnitType] = useState('flat');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!sectionName || !floorName || !label) {
            alert('Пожалуйста, заполните все поля');
            return;
        }
        onAdd({ sectionName, floorName, label, unitType });
        onClose();
    };

    const availableFloors = structure?.sections.find(s => s.name === sectionName)?.floors || [];

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="close-button" onClick={onClose}>×</button>
                <h3>Добавить новое помещение</h3>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="section-select">Подъезд:</label>
                        <select id="section-select" value={sectionName} onChange={e => setSectionName(e.target.value)} required>
                            <option value="" disabled>Выберите подъезд</option>
                            {structure?.sections.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="floor-select">Этаж:</label>
                        <select id="floor-select" value={floorName} onChange={e => setFloorName(e.target.value)} required disabled={!sectionName}>
                            <option value="" disabled>Выберите этаж</option>
                            {availableFloors.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="new-unit-label">Номер:</label>
                        <input id="new-unit-label" type="text" value={label} onChange={e => setLabel(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="new-unit-type">Тип:</label>
                        <select id="new-unit-type" value={unitType} onChange={e => setUnitType(e.target.value)}>
                            {Object.entries(unitTypeTranslations).map(([key, value]) => (
                                <option key={key} value={key}>{value}</option>
                            ))}
                        </select>
                    </div>
                    <button type="submit" className="save-button">Добавить</button>
                </form>
            </div>
        </div>
    );
};
