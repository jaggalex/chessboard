// src/EditToggle.tsx
import React from 'react';
import './EditToggle.css';

interface EditToggleProps {
    isEditMode: boolean;
    onToggle: () => void;
}

export const EditToggle: React.FC<EditToggleProps> = ({ isEditMode, onToggle }) => {
    return (
        <button onClick={onToggle} className={`edit-toggle-button ${isEditMode ? 'edit-mode-active' : ''}`}>
            {isEditMode ? 'Завершить редактирование' : 'Редактировать'}
        </button>
    );
};
