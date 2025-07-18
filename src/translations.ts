// src/translations.ts

export const unitTypeTranslations: { [key: string]: string } = {
    flat: 'Квартира',
    apartment: 'Аппартаменты',
    parking: 'Парковка',
    commercial: 'Офис',
    warehouse: 'Кладовка'
};

export const getUnitTypeTranslation = (type: string): string => {
    return unitTypeTranslations[type] || type;
};
