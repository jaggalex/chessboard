// src/types.ts

// Структура данных для одного помещения, как она приходит из map.json
export interface UnitData {
    id: string;
    label: string;
    unitType: string;
}

// Та же структура, но с добавленными координатами для рендеринга
export interface Unit extends UnitData {
    x: number;
    y: number;
    width: number;
    height: number;
}

// Тип для объекта с цветами
export interface ColorMap {
    [key: string]: string;
}

// Тип для позиции попапа
export interface PopupPosition {
    x: number;
    y: number;
}

// Тип для всего файла map.json
export interface MapData {
    sections: {
        name: string;
        floors: {
            name: string;
            index: number;
            units: UnitData[];
        }[];
    }[];
}