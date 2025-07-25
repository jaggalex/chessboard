# Описание архитектуры и принципов работы

Этот документ описывает внутреннее устройство приложения "Шахматка".

## 1. Функциональные возможности (Что делает приложение?)

Приложение предоставляет пользователю интерфейс для визуализации и редактирования схемы помещений.

-   **Режим просмотра:**
    -   **Навигация:** Схему можно свободно перетаскивать мышью и масштабировать колесом мыши.
    -   **Выбор:** Одиночный клик на помещении выделяет его рамкой. Также можно перемещать выделение с помощью стрелок на клавиатуре.
    -   **Информация:** Двойной клик на помещении открывает всплывающее окно с подробной информацией о нем.
    -   **Легенда:** В углу экрана отображается легенда с типами помещений и их цветовыми обозначениями.

-   **Режим редактирования:**
    -   Активируется специальной кнопкой и предоставляет доступ ко всем функциям изменения схемы.
    -   **Редактирование:** Двойной клик открывает форму, где можно изменить номер и тип помещения. Изменения мгновенно отражаются на схеме.
    -   **Добавление:** Специальная кнопка открывает модальное окно, где можно указать подъезд, этаж, номер и тип нового помещения. После добавления схема автоматически перестраивается.
    -   **Удаление:** Выбранное помещение можно удалить соответствующей кнопкой (требуется подтверждение).
    -   **Сохранение:** Позволяет получить итоговую структуру схемы в формате JSON, готовую для отправки на сервер.

## 2. Техническая архитектура (Как это работает?)

Ключевая особенность проекта — **гибридная архитектура**, сочетающая **React** для управления интерфейсом и состоянием, и "ванильный" **JavaScript + Konva** внутри `<iframe>` для высокопроизводительного рендеринга.

### Принцип работы

Приложение разделено на две независимые части, которые общаются через `postMessage API`.

#### A. React-приложение (Родитель)

-   **Роль:** Управляет всей бизнес-логикой, состоянием и пользовательским интерфейсом (кнопки, модальные окна, попапы). **Не занимается рендерингом схемы.**
-   **Ключевые файлы:**
    -   `App.tsx`: Главный компонент, который хранит все состояния (`isEditMode`, `selectedUnit` и т.д.), загружает первоначальные данные и содержит всю логику по отправке и получению сообщений.
    -   `FloorPlan.tsx`: "Глупый" компонент, который просто рендерит `<iframe src="/floorplan/index.html">` и передает в него данные, полученные от `App.tsx`.
    -   `UnitPopup.tsx`, `AddUnitModal.tsx`, `Legend.tsx`: Компоненты интерфейса.

#### B. Iframe-рендер (Дочерний)

-   **Роль:** Занимается исключительно рендерингом и обработкой событий на Canvas. **Ничего не знает о React или бизнес-логике.** Получает команды от родителя и сообщает ему о действиях пользователя.
-   **Ключевые файлы:**
    -   `public/floorplan/index.html`: HTML-каркас для `<iframe>`.
    -   `public/floorplan/main.js`: Сердце рендерера. Содержит "ванильный" JS-код, который:
        1.  Инициализирует сцену Konva.
        2.  Ждет от React сообщения `LOAD_DATA` с JSON-данными.
        3.  Строит и отрисовывает схему на Canvas.
        4.  Отслеживает клики, двойные клики, перетаскивание, зум и нажатия клавиш.
        5.  При любом действии пользователя (например, клик) **отправляет сообщение** родительскому React-приложению.
        6.  Слушает команды от React (`UPDATE_UNIT`, `DELETE_UNIT` и т.д.) и соответствующим образом изменяет сцену Konva.

### Протокол обмена сообщениями (`postMessage`)

**Из React в Iframe:**

-   `LOAD_DATA`: Отправляется один раз с полным JSON-объектом схемы.
-   `UPDATE_UNIT`: Отправляется после сохранения формы редактирования. Содержит ID юнита и новые данные.
-   `ADD_UNIT`: Отправляется из модального окна. Содержит данные для создания нового юнита.
-   `DELETE_UNIT`: Отправляется при подтверждении удаления. Содержит ID юнита.
-   `DESELECT_ALL`: Команда снять выделение со всех юнитов.
-   `GET_DATA_AS_JSON`: Запрос на получение актуального состояния схемы.
-   `SET_POPUP_VISIBILITY`: Сообщает, открыт ли попап, чтобы `<iframe>` мог заблокировать/разблокировать навигацию с клавиатуры.

**Из Iframe в React:**

-   `UNIT_CLICK`: Пользователь кликнул на юнит. Содержит данные юнита для выделения.
-   `UNIT_DBL_CLICK`: Пользователь дважды кликнул на юнит. Содержит данные юнита и его экранные координаты для открытия попапа.
-   `STAGE_CLICK`: Пользователь кликнул мимо юнитов.
-   `DATA_PROCESSED`: Отправляется после первоначальной обработки данных. Содержит информацию для построения легенды и структуру для модального окна добавления.
-   `UPDATED_DATA_JSON`: Ответ на `GET_DATA_AS_JSON`. Содержит полный, обновленный JSON-объект схемы.
