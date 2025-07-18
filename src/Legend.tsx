// src/Legend.tsx
import React from 'react';
import type { ColorMap } from './types';
import { getUnitTypeTranslation } from './translations';
import './Legend.css';

interface LegendProps {
    data: {
        usedUnitTypes: string[];
        colors: ColorMap;
    } | null;
}

export const Legend: React.FC<LegendProps> = ({ data }) => {
    if (!data || data.usedUnitTypes.length === 0) {
        return null;
    }

    return (
        <div className="legend-container">
            <h4>Легенда</h4>
            {data.usedUnitTypes.map(type => {
                const color = data.colors[type] || data.colors.default;
                return (
                    <div key={type} className="legend-item">
                        <span className="legend-color-box" style={{ backgroundColor: color }}></span>
                        <span className="legend-label">{getUnitTypeTranslation(type)}</span>
                    </div>
                );
            })}
        </div>
    );
};