// src/App.test.tsx
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';

// Мокируем дочерние компоненты, чтобы изолировать App
vi.mock('./FloorPlan', () => ({
    FloorPlan: () => <div data-testid="floorplan-mock"></div>
}));
vi.mock('./UnitPopup', () => ({
    UnitPopup: ({ unit }) => unit ? <div data-testid="popup-mock">Помещение №{unit.label}</div> : null
}));

describe('App Component', () => {
    it('должен отображать начальное состояние и переключаться в режим редактирования', () => {
        render(<App />);
        
        // Начальное состояние
        expect(screen.getByText('Редактировать')).toBeInTheDocument();
        expect(screen.queryByText('Добавить помещение')).not.toBeInTheDocument();

        // Переключение в режим редактирования
        act(() => {
            fireEvent.click(screen.getByText('Редактировать'));
        });
        
        expect(screen.getByText('Завершить редактирование')).toBeInTheDocument();
        expect(screen.getByText('Добавить помещение')).toBeInTheDocument();
    });

    it('кнопка "Удалить" должна быть неактивна без выбранного юнита', () => {
        render(<App />);
        act(() => {
            fireEvent.click(screen.getByText('Редактировать'));
        });
        
        const deleteButton = screen.getByText('Удалить выбранное') as HTMLButtonElement;
        expect(deleteButton.disabled).toBe(true);
    });

    it('кнопка "Удалить" должна быть активна после выбора юнита', () => {
        render(<App />);
        act(() => {
            fireEvent.click(screen.getByText('Редактировать'));
        });

        // Симулируем выбор юнита через postMessage
        act(() => {
            fireEvent(window, new MessageEvent('message', {
                data: {
                    type: 'UNIT_CLICK',
                    payload: { unit: { id: 'u1', label: '101', unitType: 'flat' } }
                },
                origin: window.location.origin,
            }));
        });

        const deleteButton = screen.getByText('Удалить выбранное') as HTMLButtonElement;
        expect(deleteButton.disabled).toBe(false);
    });

    it('должен открывать попап при получении сообщения UNIT_DBL_CLICK', () => {
        render(<App />);
        
        // Симулируем двойной клик
        act(() => {
            fireEvent(window, new MessageEvent('message', {
                data: {
                    type: 'UNIT_DBL_CLICK',
                    payload: {
                        unit: { id: 'u1', label: '101', unitType: 'flat' },
                        position: { x: 100, y: 150 }
                    }
                },
                origin: window.location.origin,
            }));
        });

        // Проверяем, что попап появился
        expect(screen.getByTestId('popup-mock')).toBeInTheDocument();
        expect(screen.getByText('Помещение №101')).toBeInTheDocument();
    });
});