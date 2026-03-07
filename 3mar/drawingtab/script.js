const toolsContainer = document.querySelector('.toolicon');
const body = document.querySelector('body');
const cursorFollower = document.querySelector('#cursor-follower');
const canvas = document.querySelector('#canvas');
const ctx = canvas.getContext('2d');
const colorPicker = document.querySelector('#color-picker');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;


let elements = []; 
let currentTool = 'select'; 
let currentPath = null; 
let selectedElement = null;
let action = 'none'; 
let startX, startY; 


let pencilSize = 3;
let eraserSize = 20;
let textTimeout; 
let currentToolHTML = ''; 


function updateCursorVisuals() {
    const currentSize = currentTool === 'pencil' ? pencilSize : eraserSize;

    cursorFollower.innerHTML = `
        <div class="cursor-circle" style="width: ${currentSize}px; height: ${currentSize}px;">
            <span class="size-text">${Math.round(currentSize)}</span>
        </div>
        <div class="cursor-icon">${currentToolHTML}</div>
    `;

    const sizeText = cursorFollower.querySelector('.size-text');
    clearTimeout(textTimeout);
    textTimeout = setTimeout(() => {
        if (sizeText) sizeText.innerText = ''; 
    }, 1000);
}

window.addEventListener('mousemove', (e) => {
    cursorFollower.style.transform = `translate(calc(${e.clientX}px - 50%), calc(${e.clientY}px - 50%))`;
});

window.addEventListener('wheel', function(e) {
    if (cursorFollower.style.display !== 'flex') return;

    const scrollAmount = e.deltaY * -0.05; 

    if (currentTool === 'pencil') {
        pencilSize += scrollAmount;
        pencilSize = Math.max(1, Math.min(pencilSize, 100)); 
    } else if (currentTool === 'eraser') {
        eraserSize += scrollAmount;
        eraserSize = Math.max(1, Math.min(eraserSize, 200)); 
    }

    updateCursorVisuals(); 
});


function renderCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    elements.forEach(el => {
        ctx.beginPath();
        
        if (el.type === 'path') {
            ctx.globalCompositeOperation = el.isEraser ? 'destination-out' : 'source-over';
            ctx.strokeStyle = el.color;
            ctx.lineWidth = el.size;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            ctx.moveTo(el.points[0].x, el.points[0].y);
            for (let i = 1; i < el.points.length; i++) {
                ctx.lineTo(el.points[i].x, el.points[i].y);
            }
            ctx.stroke();
        } 
        else if (el.type === 'rectangle') {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = el.color;
            ctx.lineWidth = el.lineWidth || 3; 
            ctx.strokeRect(el.x, el.y, el.width, el.height); 
        }
        else if (el.type === 'circle') {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = el.color;
            ctx.lineWidth = el.lineWidth || 3;
            ctx.arc(el.x, el.y, el.radius, 0, Math.PI * 2);
            ctx.stroke(); 
        }

        if (selectedElement === el && (el.type === 'rectangle' || el.type === 'circle')) {
            drawBoundingBox(el);
        }
    });
    
    ctx.globalCompositeOperation = 'source-over'; 
}


function drawBoundingBox(el) {
    let bounds = getBounds(el);
    
    ctx.strokeStyle = '#007BFF';
    ctx.lineWidth = 1; 
    ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(bounds.x + bounds.width - 5, bounds.y + bounds.height - 5, 5, 5);
    ctx.strokeRect(bounds.x + bounds.width - 5, bounds.y + bounds.height - 5, 5, 5);
}

function getBounds(el) {
    if (el.type === 'rectangle') return { x: el.x, y: el.y, width: el.width, height: el.height };
    if (el.type === 'circle') return { x: el.x - el.radius, y: el.y - el.radius, width: el.radius * 2, height: el.radius * 2 };
}

toolsContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('.tool');
    if (!btn) return;

    if (btn.title === "Clear Canvas") {
        elements = [];
        selectedElement = null;
        renderCanvas();
        return;
    }

    document.querySelectorAll('.tool').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    currentTool = btn.title.toLowerCase();

    if (currentTool === 'pencil' || currentTool === 'eraser') {
        body.style.cursor = 'none';
        cursorFollower.style.display = 'flex';
        currentToolHTML = btn.innerHTML;
        updateCursorVisuals();
    } else {
        body.style.cursor = 'default';
        cursorFollower.style.display = 'none';
    }

    if (currentTool === 'rectangle' || currentTool === 'circle') {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        let newShape = {
            id: Date.now(),
            type: currentTool,
            color: colorPicker.value, 
            lineWidth: pencilSize     
        };

        if (currentTool === 'rectangle') {
            newShape.x = centerX - 50;
            newShape.y = centerY - 50;
            newShape.width = 100;
            newShape.height = 100;
        } else if (currentTool === 'circle') {
            newShape.x = centerX;
            newShape.y = centerY;
            newShape.radius = 50;
        }

        elements.push(newShape);
        selectedElement = newShape; 
        renderCanvas();
        
        document.querySelector('[title="Select"]').click();
    }
});


canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (currentTool === 'pencil' || currentTool === 'eraser') {
        action = 'drawing';
        selectedElement = null; 
        currentPath = {
            type: 'path',
            isEraser: currentTool === 'eraser',
            color: colorPicker.value,
            size: currentTool === 'pencil' ? pencilSize : eraserSize,
            points: [{ x: mouseX, y: mouseY }]
        };
        elements.push(currentPath);
        return;
    }

    if (currentTool === 'select') {
        if (selectedElement) {
            const bounds = getBounds(selectedElement);
            const handleX = bounds.x + bounds.width - 5;
            const handleY = bounds.y + bounds.height - 5;
            
            if (mouseX >= handleX && mouseX <= handleX + 10 && mouseY >= handleY && mouseY <= handleY + 10) {
                action = 'resizing';
                startX = mouseX;
                startY = mouseY;
                return;
            }
        }

        let found = false;
        for (let i = elements.length - 1; i >= 0; i--) {
            const el = elements[i];
            if (el.type === 'rectangle') {
                if (mouseX >= el.x && mouseX <= el.x + el.width && mouseY >= el.y && mouseY <= el.y + el.height) {
                    selectedElement = el;
                    action = 'moving';
                    startX = mouseX - el.x;
                    startY = mouseY - el.y;
                    found = true;
                    break;
                }
            } else if (el.type === 'circle') {
                const dist = Math.sqrt((mouseX - el.x) ** 2 + (mouseY - el.y) ** 2);
                if (dist <= el.radius) {
                    selectedElement = el;
                    action = 'moving';
                    startX = mouseX - el.x;
                    startY = mouseY - el.y;
                    found = true;
                    break;
                }
            }
        }

        if (!found) selectedElement = null; 
        renderCanvas();
    }
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (action === 'drawing' && currentPath) {
        currentPath.points.push({ x: mouseX, y: mouseY });
        renderCanvas();
    } 
    else if (action === 'moving' && selectedElement) {
        selectedElement.x = mouseX - startX;
        selectedElement.y = mouseY - startY;
        renderCanvas();
    } 
    else if (action === 'resizing' && selectedElement) {
        if (selectedElement.type === 'rectangle') {
            selectedElement.width = Math.max(10, mouseX - selectedElement.x);
            selectedElement.height = Math.max(10, mouseY - selectedElement.y);
        } else if (selectedElement.type === 'circle') {
            selectedElement.radius = Math.max(10, Math.sqrt((mouseX - selectedElement.x) ** 2 + (mouseY - selectedElement.y) ** 2));
        }
        renderCanvas();
    }
});

window.addEventListener('mouseup', () => {
    action = 'none';
    currentPath = null;
});