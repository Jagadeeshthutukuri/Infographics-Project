function rgbToHex(rgb) {
    const result = rgb.match(/\d+/g);
    if (!result) return '#000000';
    return "#" + result.slice(0, 3).map(x => {
        const hex = parseInt(x).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    }).join('');
}

function updateTextFormattingButtons() {
    if (!selectedElement || selectedElement.dataset.type !== 'text') {
        boldBtn.classList.remove('active');
        italicBtn.classList.remove('active');
        underlineBtn.classList.remove('active');
        return;
    }
    const style = window.getComputedStyle(selectedElement);
    boldBtn.classList.toggle('active', style.fontWeight === '700' || style.fontWeight === 'bold');
    italicBtn.classList.toggle('active', style.fontStyle === 'italic');
    underlineBtn.classList.toggle('active', style.textDecorationLine.includes('underline'));
}

const NAVBAR_HEIGHT = 50;

const canvas = document.getElementById('canvas');
const addTextBtn = document.getElementById('add-text');
const addRectBtn = document.getElementById('add-rect');
const addCircleBtn = document.getElementById('add-circle');
const addTriangleBtn = document.getElementById('add-triangle');
const addLineBtn = document.getElementById('add-line');
const addImageBtn = document.getElementById('add-image');
const imageUploadInput = document.getElementById('image-upload');
const exportBtn = document.getElementById('export');
const propertiesContent = document.getElementById('properties-content');

const deleteBtn = document.getElementById('delete-element');
const undoBtn = document.getElementById('undo');
const redoBtn = document.getElementById('redo');
const bringForwardBtn = document.getElementById('bring-forward');
const sendBackwardBtn = document.getElementById('send-backward');
const boldBtn = document.getElementById('bold');
const italicBtn = document.getElementById('italic');
const underlineBtn = document.getElementById('underline');

const alignLeftBtn = document.getElementById('align-left');
const alignCenterBtn = document.getElementById('align-center');
const alignRightBtn = document.getElementById('align-right');
const fontFamilySelect = document.getElementById('font-family');

const canvasBgColorInput = document.getElementById('canvas-bg-color');
const zoomInBtn = document.getElementById('zoom-in');
const zoomOutBtn = document.getElementById('zoom-out');
const importJsonBtn = document.getElementById('import-json');
const importJsonFileInput = document.getElementById('import-json-file');

let selectedElement = null;
let multiSelectElements = new Set();

let undoStack = [];
let redoStack = [];

let currentZoom = 1;

let shapeToAdd = null;

const shapeButtons = [
    {btn: addTextBtn, type: 'text'},
    {btn: addRectBtn, type: 'rect'},
    {btn: addCircleBtn, type: 'circle'},
    {btn: addTriangleBtn, type: 'triangle'},
    {btn: addLineBtn, type: 'line'},
];

shapeButtons.forEach(({btn, type}) => {
    btn.addEventListener('click', () => { shapeToAdd = type; });
});

function createElementAtPosition(type, x, y) {
    const el = document.createElement(type === 'image' ? 'img' : 'div');
    el.classList.add('element');
    el.style.position = 'absolute';
    el.style.width = '100px';
    el.style.height = '100px';
    el.dataset.type = type;
    el.style.left = (x - 50) + 'px';
    el.style.top = (y - 50) + 'px';

    switch(type) {
        case 'text':
            setTextElementDefaults(el);
            break;
        case 'rect':
            el.style.backgroundColor = '#3498db';
            el.style.borderRadius = '0';
            break;
        case 'circle':
            el.style.backgroundColor = '#e74c3c';
            el.style.borderRadius = '50%';
            break;
        case 'triangle':
            setTriangleStyles(el);
            break;
        case 'line':
            el.style.width = '100px';
            el.style.height = '2px';
            el.style.backgroundColor = '#000';
            break;
        case 'image':
            break;
    }

    addElementEventListeners(el);
    addResizeHandles(el);
    canvas.appendChild(el);
    selectElement(el);
    saveState();
}

function setStarStyles(el) {
}

function setArrowStyles(el) {
}

function setPolygonStyles(el) {
}

shapeButtons.forEach(({btn, type}) => {
    btn.addEventListener('click', () => { shapeToAdd = type; });
});

addImageBtn.addEventListener('click', () => {
    shapeToAdd = 'image';
    imageUploadInput.click();
});

canvas.addEventListener('click', (e) => {
    if (shapeToAdd) {
        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top - NAVBAR_HEIGHT;
        createElementAtPosition(shapeToAdd, clickX, clickY);
        shapeToAdd = null;
    } else {
        clearSelection();
    }
});

function clearSelection() {
    if (selectedElement) {
        selectedElement.classList.remove('selected');
        selectedElement = null;
        propertiesContent.innerHTML = '<p>Select an element to edit its properties</p>';
        updateTextFormattingButtons();
    }
    multiSelectElements.forEach(el => el.classList.remove('multi-selected'));
    multiSelectElements.clear();
    updateTextFormattingButtons();
}

function updateTextFormattingButtons() {
    if (!selectedElement || selectedElement.dataset.type !== 'text') {
        boldBtn.classList.remove('active');
        italicBtn.classList.remove('active');
        underlineBtn.classList.remove('active');
        return;
    }
    const style = window.getComputedStyle(selectedElement);
    boldBtn.classList.toggle('active', style.fontWeight === '700' || style.fontWeight === 'bold');
    italicBtn.classList.toggle('active', style.fontStyle === 'italic');
    underlineBtn.classList.toggle('active', style.textDecorationLine.includes('underline'));
}


function addResizeHandles(el) {
    // Basic resize handle implementation
    // Remove existing handles first
    const existingHandles = el.querySelectorAll('.resizer');
    existingHandles.forEach(handle => handle.remove());

    const resizer = document.createElement('div');
    resizer.classList.add('resizer');
    resizer.style.width = '10px';
    resizer.style.height = '10px';
    resizer.style.background = '#3498db';
    resizer.style.position = 'absolute';
    resizer.style.right = '0';
    resizer.style.bottom = '0';
    resizer.style.cursor = 'se-resize';

    let startX, startY, startWidth, startHeight;

    resizer.addEventListener('mousedown', function(e) {
        e.stopPropagation();
        startX = e.clientX;
        startY = e.clientY;
        startWidth = parseInt(document.defaultView.getComputedStyle(el).width, 10);
        startHeight = parseInt(document.defaultView.getComputedStyle(el).height, 10);
        document.documentElement.addEventListener('mousemove', doDrag, false);
        document.documentElement.addEventListener('mouseup', stopDrag, false);
    });

    function doDrag(e) {
        el.style.width = (startWidth + e.clientX - startX) + 'px';
        el.style.height = (startHeight + e.clientY - startY) + 'px';
        showProperties(el);
    }

    function stopDrag(e) {
        document.documentElement.removeEventListener('mousemove', doDrag, false);
        document.documentElement.removeEventListener('mouseup', stopDrag, false);
        saveState();
    }

    el.appendChild(resizer);
}

function createElementAtPosition(type, x, y) {
    const el = document.createElement(type === 'image' ? 'img' : 'div');
    el.classList.add('element');
    el.style.position = 'absolute';
    el.style.width = '100px';
    el.style.height = '100px';
    el.dataset.type = type;
    el.style.left = (x - 50) + 'px';
    el.style.top = (y - 50) + 'px';

    switch(type) {
        case 'text':
            setTextElementDefaults(el);
            break;
        case 'rect':
            el.style.backgroundColor = '#3498db';
            el.style.borderRadius = '0';
            break;
        case 'circle':
            el.style.backgroundColor = '#e74c3c';
            el.style.borderRadius = '50%';
            break;
        case 'triangle':
            setTriangleStyles(el);
            break;
        case 'line':
            el.style.width = '100px';
            el.style.height = '2px';
            el.style.backgroundColor = '#000';
            break;
        case 'image':
            break;
    }

    addElementEventListeners(el);
    addResizeHandles(el);
    canvas.appendChild(el);
    selectElement(el);
    saveState();
}

function setTextElementDefaults(el) {
    el.contentEditable = true;
    el.innerText = 'Edit me';
    el.style.border = 'none';
    el.style.cursor = 'text';
    el.style.padding = '4px';
    el.style.backgroundColor = 'transparent';
    el.style.color = '#000';
    el.style.fontSize = '16px';
    el.style.fontWeight = 'normal';
    el.style.fontStyle = 'normal';
    el.style.textDecoration = 'none';
    el.style.textAlign = 'left';
    el.style.fontFamily = 'Arial, sans-serif';
}

function setTriangleStyles(el) {
    el.style.width = '0';
    el.style.height = '0';
    el.style.borderLeft = '50px solid transparent';
    el.style.borderRight = '50px solid transparent';
    el.style.borderBottom = '100px solid #3498db';
    el.style.backgroundColor = 'transparent';
}

function saveState() {
    const elements = [];
    canvas.querySelectorAll('.element').forEach(el => {
        elements.push(serializeElement(el));
    });
    undoStack.push(elements);
    redoStack = [];
    updateUndoRedoButtons();
}

function restoreState(state) {
    canvas.innerHTML = '';
    state.forEach(data => {
        const el = deserializeElement(data);
        canvas.appendChild(el);
        addElementEventListeners(el);
        addResizeHandles(el);
    });
}

function updateUndoRedoButtons() {
    undoBtn.disabled = undoStack.length === 0;
    redoBtn.disabled = redoStack.length === 0;
}

function serializeElement(el) {
    const type = el.dataset.type;
    const data = {
        type,
        left: el.style.left,
        top: el.style.top,
        width: el.style.width,
        height: el.style.height,
        zIndex: el.style.zIndex || '0'
    };
    if (type === 'text') {
        data.text = el.innerText;
        data.fontSize = el.style.fontSize;
        data.color = el.style.color;
        data.fontWeight = el.style.fontWeight || 'normal';
        data.fontStyle = el.style.fontStyle || 'normal';
        data.textDecoration = el.style.textDecoration || 'none';
        data.textAlign = el.style.textAlign || 'left';
        data.fontFamily = el.style.fontFamily || 'Arial, sans-serif';
    } else if (['rect', 'circle', 'triangle', 'line'].includes(type)) {
        data.color = el.style.backgroundColor;
        data.borderRadius = el.style.borderRadius || '0';
        if(type === 'line'){
            data.width = el.style.width;
            data.height = el.style.height;
            data.backgroundColor = el.style.backgroundColor;
        }
    } else if (type === 'image') {
        data.src = el.src;
    }
    return data;
}

function deserializeElement(data) {
    let el;
    if (data.type === 'image') {
        el = document.createElement('img');
        el.src = data.src;
    } else if(data.type === 'line'){
        el = document.createElement('div');
        el.style.backgroundColor = data.color || '#000';
        el.style.height = '2px';
        el.style.width = data.width || '100px';
    } else if(data.type === 'triangle'){
        el = document.createElement('div');
        el.style.width = '0';
        el.style.height = '0';
        el.style.borderLeft = '50px solid transparent';
        el.style.borderRight = '50px solid transparent';
        el.style.borderBottom = `100px solid ${data.color || '#3498db'}`;
        el.style.backgroundColor = 'transparent';
    } else {
        el = document.createElement('div');
        el.innerText = data.text || '';
    }
    el.classList.add('element');
    el.dataset.type = data.type;
    el.style.position = 'absolute';
    el.style.left = data.left;
    el.style.top = data.top;
    el.style.width = data.width;
    el.style.height = data.height;
    el.style.zIndex = data.zIndex || '0';

    if (data.type === 'text') {
        el.contentEditable = true;
        el.style.border = 'none';
        el.style.cursor = 'text';
        el.style.padding = '4px';
        el.style.backgroundColor = 'transparent';
        el.style.color = data.color || '#000';
        el.style.fontSize = data.fontSize || '16px';
        el.style.fontWeight = data.fontWeight || 'normal';
        el.style.fontStyle = data.fontStyle || 'normal';
        el.style.textDecoration = data.textDecoration || 'none';
        el.style.textAlign = data.textAlign || 'left';
        el.style.fontFamily = data.fontFamily || 'Arial, sans-serif';
    } else if (['rect', 'circle'].includes(data.type)) {
        el.style.backgroundColor = data.color || '#3498db';
        el.style.borderRadius = data.borderRadius || (data.type === 'circle' ? '50%' : '0');
    }

    addElementEventListeners(el);
    addResizeHandles(el);
    return el;
}

function addElementEventListeners(el) {
    el.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        if(e.shiftKey){
            toggleMultiSelect(el);
        } else {
            selectElement(el);
            startDrag(e, el);
        }
    });

    el.addEventListener('click', (e) => {
        e.stopPropagation();
        if(e.shiftKey){
            toggleMultiSelect(el);
        } else {
            selectElement(el);
        }
    });
}

function toggleMultiSelect(el){
    if(multiSelectElements.has(el)){
        multiSelectElements.delete(el);
        el.classList.remove('multi-selected');
    } else {
        multiSelectElements.add(el);
        el.classList.add('multi-selected');
    }
    if(multiSelectElements.size > 0){
        selectedElement = null;
        propertiesContent.innerHTML = '<p>Multiple elements selected</p>';
        updateTextFormattingButtons();
    } else {
        propertiesContent.innerHTML = '<p>Select an element to edit its properties</p>';
        updateTextFormattingButtons();
    }
}

function selectElement(el) {
    if (selectedElement) {
        selectedElement.classList.remove('selected');
    }
    selectedElement = el;
    multiSelectElements.clear();
    if (selectedElement) {
        selectedElement.classList.add('selected');
        showProperties(selectedElement);
        updateTextFormattingButtons();
    } else {
        propertiesContent.innerHTML = '<p>Select an element to edit its properties</p>';
        updateTextFormattingButtons();
    }
}

function rgbToHex(rgb) {
    const result = rgb.match(/\d+/g);
    if (!result) return '#000000';
    return "#" + result.slice(0, 3).map(x => {
        const hex = parseInt(x).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    }).join('');
}

function showProperties(el) {
    const type = el.dataset.type;
    let html = '';

    html += '<label>Position X: <input type="number" id="prop-left" value="' + parseInt(el.style.left) + '" /></label>';
    html += '<label>Position Y: <input type="number" id="prop-top" value="' + parseInt(el.style.top) + '" /></label>';
    html += '<label>Width: <input type="number" id="prop-width" value="' + parseInt(el.style.width) + '" /></label>';
    html += '<label>Height: <input type="number" id="prop-height" value="' + parseInt(el.style.height) + '" /></label>';

    if (type === 'text') {
        html += '<label>Text: <input type="text" id="prop-text" value="' + el.innerText + '" /></label>';
        html += '<label>Font Size: <input type="number" id="prop-fontsize" value="' + parseInt(window.getComputedStyle(el).fontSize) + '" /></label>';
        html += '<label>Color: <input type="color" id="prop-color" value="' + rgbToHex(window.getComputedStyle(el).color) + '" /></label>';
        html += '<label>Text Align: <select id="prop-text-align"><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></label>';
        html += '<label>Font Family: <select id="prop-font-family"><option value="Arial, sans-serif">Arial</option><option value="\'Times New Roman\', serif">Times New Roman</option><option value="\'Courier New\', monospace">Courier New</option><option value="Georgia, serif">Georgia</option><option value="Verdana, sans-serif">Verdana</option></select></label>';
    } else if (['rect', 'circle', 'triangle', 'line'].includes(type)) {
        html += '<label>Color: <input type="color" id="prop-color" value="' + rgbToHex(window.getComputedStyle(el).backgroundColor) + '" /></label>';
    }

    propertiesContent.innerHTML = html;


    document.getElementById('prop-left').addEventListener('input', (e) => {
        el.style.left = e.target.value + 'px';
        saveState();
    });
    document.getElementById('prop-top').addEventListener('input', (e) => {
        el.style.top = e.target.value + 'px';
        saveState();
    });
    document.getElementById('prop-width').addEventListener('input', (e) => {
        el.style.width = e.target.value + 'px';
        saveState();
    });
    document.getElementById('prop-height').addEventListener('input', (e) => {
        el.style.height = e.target.value + 'px';
        saveState();
    });

    if (type === 'text') {
        document.getElementById('prop-text').addEventListener('input', (e) => {
            el.innerText = e.target.value;
            saveState();
        });
        document.getElementById('prop-fontsize').addEventListener('input', (e) => {
            el.style.fontSize = e.target.value + 'px';
            saveState();
        });
        document.getElementById('prop-color').addEventListener('input', (e) => {
            el.style.color = e.target.value;
            saveState();
        });
        document.getElementById('prop-text-align').value = el.style.textAlign || 'left';
        document.getElementById('prop-text-align').addEventListener('change', (e) => {
            el.style.textAlign = e.target.value;
            saveState();
        });
        document.getElementById('prop-font-family').value = el.style.fontFamily || 'Arial, sans-serif';
        document.getElementById('prop-font-family').addEventListener('change', (e) => {
            el.style.fontFamily = e.target.value;
            saveState();
        });
    } else if (['rect', 'circle', 'triangle', 'line'].includes(type)) {
        document.getElementById('prop-color').addEventListener('input', (e) => {
            el.style.backgroundColor = e.target.value;
            saveState();
        });
    }
}

let dragData = null;

function startDrag(e, el) {
    dragData = {
        el: el,
        startX: e.clientX,
        startY: e.clientY - NAVBAR_HEIGHT,
        origX: parseInt(el.style.left),
        origY: parseInt(el.style.top)
    };
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', endDrag);
}

function onDrag(e) {
    if (!dragData) return;
    const dx = e.clientX - dragData.startX;
    const dy = e.clientY - dragData.startY;
    if(multiSelectElements.size > 0){
        multiSelectElements.forEach(el => {
            const origX = parseInt(el.style.left);
            const origY = parseInt(el.style.top);
            el.style.left = origX + dx + 'px';
            el.style.top = origY + dy + 'px';
        });
    } else {
        dragData.el.style.left = dragData.origX + dx + 'px';
        dragData.el.style.top = dragData.origY + dy + 'px';
        showProperties(dragData.el);
    }
    saveState();
}

function endDrag(e) {
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', endDrag);
    dragData = null;
}

addTextBtn.addEventListener('click', () => createElementAtPosition('text', 100, 100));
addRectBtn.addEventListener('click', () => createElementAtPosition('rect', 100, 100));
addCircleBtn.addEventListener('click', () => createElementAtPosition('circle', 100, 100));
addTriangleBtn.addEventListener('click', () => createElementAtPosition('triangle', 100, 100));
addLineBtn.addEventListener('click', () => createElementAtPosition('line', 100, 100));
addImageBtn.addEventListener('click', () => imageUploadInput.click());

imageUploadInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
        const el = document.createElement('img');
        el.src = event.target.result;
        el.classList.add('element');
        el.style.position = 'absolute';
        el.style.left = '50px';
        el.style.top = '50px';
        el.style.width = '150px';
        el.style.height = 'auto';
        el.dataset.type = 'image';

        addElementEventListeners(el);
        addResizeHandles(el);
        canvas.appendChild(el);
        selectElement(el);
        saveState();
    };
    reader.readAsDataURL(file);
    e.target.value = '';
});

canvas.addEventListener('click', () => {
    clearSelection();
});

exportBtn?.addEventListener('click', () => {
    const elements = [];
    canvas.querySelectorAll('.element').forEach(el => {
        elements.push(serializeElement(el));
    });
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(elements, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "infographic.json");
    dlAnchorElem.click();
});

undoBtn.addEventListener('click', () => {
    if (undoStack.length === 0) return;
    const currentState = [];
    canvas.querySelectorAll('.element').forEach(el => {
        currentState.push(serializeElement(el));
    });
    redoStack.push(currentState);
    const prevState = undoStack.pop();
    restoreState(prevState);
    updateUndoRedoButtons();
    clearSelection();
});

redoBtn.addEventListener('click', () => {
    if (redoStack.length === 0) return;
    const currentState = [];
    canvas.querySelectorAll('.element').forEach(el => {
        currentState.push(serializeElement(el));
    });
    undoStack.push(currentState);
    const nextState = redoStack.pop();
    restoreState(nextState);
    updateUndoRedoButtons();
    clearSelection();
});

deleteBtn.addEventListener('click', () => {
    if (selectedElement) {
        selectedElement.remove();
        selectedElement = null;
        saveState();
        clearSelection();
    } else if (multiSelectElements.size > 0) {
        multiSelectElements.forEach(el => el.remove());
        multiSelectElements.clear();
        saveState();
        clearSelection();
    }
});

boldBtn.addEventListener('click', () => {
    if (!selectedElement || selectedElement.dataset.type !== 'text') return;
    const isBold = window.getComputedStyle(selectedElement).fontWeight === '700' || window.getComputedStyle(selectedElement).fontWeight === 'bold';
    selectedElement.style.fontWeight = isBold ? 'normal' : 'bold';
    updateTextFormattingButtons();
    saveState();
});

italicBtn.addEventListener('click', () => {
    if (!selectedElement || selectedElement.dataset.type !== 'text') return;
    const isItalic = window.getComputedStyle(selectedElement).fontStyle === 'italic';
    selectedElement.style.fontStyle = isItalic ? 'normal' : 'italic';
    updateTextFormattingButtons();
    saveState();
});

underlineBtn.addEventListener('click', () => {
    if (!selectedElement || selectedElement.dataset.type !== 'text') return;
    const isUnderline = window.getComputedStyle(selectedElement).textDecorationLine.includes('underline');
    selectedElement.style.textDecoration = isUnderline ? 'none' : 'underline';
    updateTextFormattingButtons();
    saveState();
});

fontFamilySelect.addEventListener('change', (e) => {
    if (!selectedElement || selectedElement.dataset.type !== 'text') return;
    selectedElement.style.fontFamily = e.target.value;
    saveState();
});

alignLeftBtn.addEventListener('click', () => {
    if (!selectedElement || selectedElement.dataset.type !== 'text') return;
    selectedElement.style.textAlign = 'left';
    saveState();
});

alignCenterBtn.addEventListener('click', () => {
    if (!selectedElement || selectedElement.dataset.type !== 'text') return;
    selectedElement.style.textAlign = 'center';
    saveState();
});

alignRightBtn.addEventListener('click', () => {
    if (!selectedElement || selectedElement.dataset.type !== 'text') return;
    selectedElement.style.textAlign = 'right';
    saveState();
});

zoomInBtn.addEventListener('click', () => {
    currentZoom = Math.min(currentZoom * 1.1, 3);
    canvas.style.transform = `scale(${currentZoom})`;
    canvas.style.transformOrigin = '0 0';
});

zoomOutBtn.addEventListener('click', () => {
    currentZoom = Math.max(currentZoom / 1.1, 0.5);
    canvas.style.transform = `scale(${currentZoom})`;
    canvas.style.transformOrigin = '0 0';
});
