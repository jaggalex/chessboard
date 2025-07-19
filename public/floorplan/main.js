// public/floorplan/main.js
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('container');
    if (!container) return;

    let stage, layer;
    let allUnits = [];
    let lastSelected = null;
    let originalData = null;
    let isPopupVisible = false;

    const appOrigin = window.location.origin;

    const STROKE_DEFAULT = '#333';
    const STROKE_WIDTH_DEFAULT = 1;
    const STROKE_SELECTED = '#007bff';
    const STROKE_WIDTH_SELECTED = 4;
    const UNIT_WIDTH = 70;
    const UNIT_HEIGHT = 90;
    const PADDING = 10;
    const FLOOR_LABEL_WIDTH = 50;
    const SECTION_PADDING = 50;
    const defaultColors = {
        'flat': '#28a745', 'apartment': '#17a2b8', 'parking': '#6c757d',
        'storage': '#ffc107', 'commercial': '#dc3545', 'default': '#6610f2',
    };

    function initializeStage() {
        stage = new Konva.Stage({
            container: 'container',
            width: window.innerWidth,
            height: window.innerHeight,
            draggable: true,
        });
        layer = new Konva.Layer();
        stage.add(layer);
        setupEventHandlers();
    }

    function redrawAll() {
        const layout = generateStructuredLayout(originalData);
        drawLayout(layout);
        lastSelected = null;
    }

    function generateStructuredLayout(data) {
        if (!originalData) {
            originalData = JSON.parse(JSON.stringify(data));
        }
        let currentX = PADDING;
        const layout = { sections: [] };
        const usedUnitTypes = new Set();
        allUnits = [];

        data.sections.forEach(sectionData => {
            const floors = [...sectionData.floors].sort((a, b) => b.index - a.index);
            let maxUnitsOnFloor = 0;
            floors.forEach(floor => {
                floor.units.sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
                if (floor.units.length > maxUnitsOnFloor) maxUnitsOnFloor = floor.units.length;
                floor.units.forEach(u => usedUnitTypes.add(u.unitType));
            });

            const sectionWidth = FLOOR_LABEL_WIDTH + (maxUnitsOnFloor * (UNIT_WIDTH + PADDING)) + PADDING;
            const sectionLayout = { x: currentX, y: PADDING, name: `Подъезд ${sectionData.name}`, floors: [] };
            let currentY = PADDING + 40;

            floors.forEach(floorData => {
                const floorLayout = { x: sectionLayout.x, y: currentY, name: `Этаж ${floorData.name}`, units: [] };
                floorData.units.forEach((unitData, i) => {
                    const unitLayout = {
                        ...unitData,
                        x: floorLayout.x + FLOOR_LABEL_WIDTH + (i * (UNIT_WIDTH + PADDING)),
                        y: floorLayout.y,
                        width: UNIT_WIDTH,
                        height: UNIT_HEIGHT,
                    };
                    floorLayout.units.push(unitLayout);
                    allUnits.push(unitLayout);
                });
                sectionLayout.floors.push(floorLayout);
                currentY += UNIT_HEIGHT + PADDING;
            });
            layout.sections.push(sectionLayout);
            currentX += sectionWidth + SECTION_PADDING;
        });
        
        window.parent.postMessage({ 
            type: 'DATA_PROCESSED', 
            payload: { 
                legend: { usedUnitTypes: Array.from(usedUnitTypes), colors: defaultColors },
                structure: data
            } 
        }, appOrigin);

        return layout;
    }

    function drawLayout(layout) {
        layer.destroyChildren();
        layout.sections.forEach(section => {
            layer.add(new Konva.Text({ x: section.x, y: section.y, text: section.name, fontSize: 20, fontStyle: 'bold', fill: '#555' }));
            section.floors.forEach(floor => {
                layer.add(new Konva.Text({ x: floor.x, y: floor.y + UNIT_HEIGHT / 2 - 9, text: floor.name, fontSize: 16, fill: '#777', width: FLOOR_LABEL_WIDTH, align: 'center' }));
                floor.units.forEach(unit => {
                    const group = new Konva.Group({ x: unit.x, y: unit.y, id: unit.id });
                    group.add(new Konva.Rect({
                        width: unit.width, height: unit.height,
                        fill: defaultColors[unit.unitType] || defaultColors.default,
                        stroke: STROKE_DEFAULT, strokeWidth: STROKE_WIDTH_DEFAULT,
                        name: 'unit-rect', cornerRadius: 3,
                    }));
                    group.add(new Konva.Text({
                        text: unit.label, fontSize: 16, fontFamily: 'Arial, sans-serif', fill: '#fff',
                        width: unit.width, height: unit.height,
                        align: 'center', verticalAlign: 'middle', listening: false,
                    }));
                    layer.add(group);
                });
            });
        });
    }

    function selectUnit(group) {
        if (lastSelected && lastSelected !== group) {
            deselectAll();
        }
        group.findOne('.unit-rect').stroke(STROKE_SELECTED).strokeWidth(STROKE_WIDTH_SELECTED);
        lastSelected = group;
        const unitData = allUnits.find(unit => unit.id === group.id());
        if (unitData) {
            window.parent.postMessage({ type: 'UNIT_CLICK', payload: { unit: unitData } }, appOrigin);
        }
    }

    function deselectAll() {
        if (lastSelected) {
            lastSelected.findOne('.unit-rect').stroke(STROKE_DEFAULT).strokeWidth(STROKE_WIDTH_DEFAULT);
            lastSelected = null;
        }
    }

    function reconstructJSON() {
        return originalData;
    }

    function setupEventHandlers() {
        stage.on('click tap', (e) => {
            const group = e.target.getParent();
            if (!group || e.target.name() !== 'unit-rect') {
                deselectAll();
                window.parent.postMessage({ type: 'STAGE_CLICK' }, appOrigin);
                return;
            }
            selectUnit(group);
        });

        stage.on('dblclick dbltap', (e) => {
            const group = e.target.getParent();
            if (group && group.name() !== 'unit-rect') {
                 const unitData = allUnits.find(unit => unit.id === group.id());
                 if (unitData) {
                    const unitPos = group.getAbsolutePosition();
                    window.parent.postMessage({ type: 'UNIT_DBL_CLICK', payload: { unit: unitData, position: unitPos } }, appOrigin);
                 }
            }
        });

        stage.on('wheel', (e) => {
            e.evt.preventDefault();
            const scaleBy = 1.1;
            const oldScale = stage.scaleX();
            const pointer = stage.getPointerPosition();
            if (!pointer) return;
            const mousePointTo = { x: (pointer.x - stage.x()) / oldScale, y: (pointer.y - stage.y()) / oldScale };
            const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
            if (newScale < 0.05 || newScale > 10) return;
            
            stage.to({
                scaleX: newScale,
                scaleY: newScale,
                x: pointer.x - mousePointTo.x * newScale,
                y: pointer.y - mousePointTo.y * newScale,
                duration: 0.1,
                easing: Konva.Easings.EaseOut,
            });
        });
    }

    window.addEventListener('keydown', (e) => {
        if (isPopupVisible || !lastSelected) return;
        const currentUnit = allUnits.find(u => u.id === lastSelected.id());
        if (!currentUnit) return;
        let nextUnit;
        const unitsByY = allUnits.reduce((acc, u) => {
            acc[u.y] = (acc[u.y] || []).sort((a, b) => a.x - b.x);
            acc[u.y].push(u);
            return acc;
        }, {});
        const floorsY = Object.keys(unitsByY).map(parseFloat).sort((a, b) => a - b);
        const currentFloorY = currentUnit.y;
        const currentFloorUnits = unitsByY[currentFloorY];
        const currentIndexOnFloor = currentFloorUnits.findIndex(u => u.id === currentUnit.id);
        switch (e.key) {
            case 'ArrowLeft':
                if (currentIndexOnFloor > 0) nextUnit = currentFloorUnits[currentIndexOnFloor - 1];
                break;
            case 'ArrowRight':
                if (currentIndexOnFloor < currentFloorUnits.length - 1) nextUnit = currentFloorUnits[currentIndexOnFloor + 1];
                break;
            case 'ArrowUp':
            case 'ArrowDown':
                const currentFloorIndex = floorsY.indexOf(currentFloorY);
                const nextFloorIndex = e.key === 'ArrowUp' ? currentFloorIndex - 1 : currentFloorIndex + 1;
                if (nextFloorIndex >= 0 && nextFloorIndex < floorsY.length) {
                    const nextFloorY = floorsY[nextFloorIndex];
                    const nextFloorUnits = unitsByY[nextFloorY];
                    nextUnit = nextFloorUnits.reduce((prev, curr) => Math.abs(curr.x - currentUnit.x) < Math.abs(prev.x - currentUnit.x) ? curr : prev);
                }
                break;
        }
        if (nextUnit) {
            e.preventDefault();
            const nextGroup = stage.findOne(`#${nextUnit.id}`);
            if (nextGroup) selectUnit(nextGroup);
        }
    });

    window.addEventListener('message', (event) => {
        if (event.origin !== appOrigin) return;
        const { type, payload } = event.data;
        switch (type) {
            case 'LOAD_DATA':
                if (payload) { originalData = payload; redrawAll(); }
                break;
            case 'RESET_VIEW':
                stage.position({ x: 0, y: 0 }); stage.scale({ x: 1, y: 1 });
                break;
            case 'DESELECT_ALL':
                deselectAll();
                break;
            case 'SET_POPUP_VISIBILITY':
                isPopupVisible = payload.isVisible;
                break;
            case 'UPDATE_UNIT':
                const unitToUpdate = originalData.sections.flatMap(s => s.floors).flatMap(f => f.units).find(u => u.id === payload.id);
                if (unitToUpdate) {
                    unitToUpdate.label = payload.newData.label;
                    unitToUpdate.unitType = payload.newData.unitType;
                    redrawAll();
                }
                break;
            case 'ADD_UNIT':
                const targetFloor = originalData.sections.find(s => s.name === payload.sectionName)?.floors.find(f => f.name === payload.floorName);
                if (targetFloor) {
                    targetFloor.units.push({ id: `unit-${Date.now()}`, label: payload.label, unitType: payload.unitType });
                    redrawAll();
                }
                break;
            case 'DELETE_UNIT':
                 originalData.sections.forEach(s => { s.floors.forEach(f => { f.units = f.units.filter(u => u.id !== payload.id) }) });
                 redrawAll();
                break;
            case 'GET_DATA_AS_JSON':
                window.parent.postMessage({ type: 'UPDATED_DATA_JSON', payload: reconstructJSON() }, appOrigin);
                break;
        }
    });

    initializeStage();
});