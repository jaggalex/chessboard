// src/App.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';

// Mocking the FloorPlan component to avoid dealing with the iframe complexities in tests
vi.mock('./FloorPlan', () => ({
    FloorPlan: ({ iframeRef }) => <iframe ref={iframeRef} data-testid="floorplan-iframe"></iframe>
}));

describe('App Component', () => {
    it('должен отображать начальное состояние (режим просмотра)', () => {
        render(<App />);
        
        // Проверяем наличие кнопок режима просмотра
        expect(screen.getByText('Редактировать')).toBeInTheDocument();
        expect(screen.getByText('Сбросить вид')).toBeInTheDocument();

        // Проверяем отсутствие кнопок режима редактирования
        expect(screen.queryByText('Добавить помещение')).not.toBeInTheDocument();
        expect(screen.queryByText('Удалить выбранное')).not.toBeInTheDocument();
        expect(screen.queryByText('Сохранить схему')).not.toBeInTheDocument();
    });

    it('должен переключаться в режим редактирования и обратно', () => {
        render(<App />);
        
        const editButton = screen.getByText('Редактировать');
        fireEvent.click(editButton);

        // Проверяем, что появились кнопки режима редактирования
        expect(screen.getByText('Завершить редактирование')).toBeInTheDocument();
        expect(screen.getByText('Добавить помещение')).toBeInTheDocument();
        expect(screen.getByText('Удалить выбранное')).toBeInTheDocument();
        expect(screen.getByText('Сохранить схему')).toBeInTheDocument();

        // Кликаем еще раз для выхода из режима
        fireEvent.click(screen.getByText('Завершить редактирование'));
        expect(screen.getByText('Редактировать')).toBeInTheDocument();
        expect(screen.queryByText('Добавить помещение')).not.toBeInTheDocument();
    });

    it('кнопка "Удалить" должна быть неактивна, если помещение не выбрано', () => {
        render(<App />);
        fireEvent.click(screen.getByText('Редактировать'));
        
        const deleteButton = screen.getByText('Удалить выбранное') as HTMLButtonElement;
        expect(deleteButton.disabled).toBe(true);
    });

    // Этот тест демонстрирует, как можно было бы проверить взаимодействие с postMessage,
    // но требует более сложной настройки моков для window и iframe.
    it('должен открывать попап при получении сообщения UNIT_DBL_CLICK', async () => {
        render(<App />);
        
        // Симулируем получение сообщения от iframe
        fireEvent(window, new MessageEvent('message', {
            data: {
                type: 'UNIT_DBL_CLICK',
                payload: {
                    unit: { id: 'u1', label: '101', unitType: 'flat' },
                    position: { x: 100, y: 150 }
                }
            }
        }));

        // Ждем появления попапа
        await waitFor(() => {
            // В попапе будет заголовок с номером помещения
            expect(screen.getByText('Помещение №101')).toBeInTheDocument();
        });
    });
});
