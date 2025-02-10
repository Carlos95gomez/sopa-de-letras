let palabras = [];
let cuadricula = [];
let celdasSeleccionadas = [];
let ratonPresionado = false;
let palabrasEncontradas = new Set();
let celdasEncontradas = new Map();
const tamañoCuadricula = 15;
const maximoPalabras = 12;
const colores = [
    '#FF6B6B','#4ECDC4','#45B7D6','#96CEB9','#FFEEAE','#D4A5A5','#9B59B6','#3498DB','#E67E22','#1ABC9C','#F1C40F','#E74C3C'
];

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const entradaPalabra = document.getElementById('entradaPalabra');
    entradaPalabra.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            agregarPalabra();
        }
    });
});

document.addEventListener('mousedown', e => {
    if (e.target.tagName !== 'INPUT') {
        e.preventDefault();
    }
});

//Eventos para mobiles
document.addEventListener('DOMContentLoaded', () => {
    const cuadricula = document.getElementById('cuadricula');

    // Prevenir comportamientos predeterminados
    cuadricula.addEventListener('touchstart', (e) => {
        e.preventDefault();
    }, { passive: false });

    cuadricula.addEventListener('touchmove', (e) => {
        e.preventDefault();
    }, { passive: false });

    // Variables para manejar la selección táctil
    let touchInProgress = false;
    let touchStartCell = null;

    // Evento de inicio de toque
    cuadricula.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        const cell = document.elementFromPoint(touch.clientX, touch.clientY);

        if (cell && cell.classList.contains('celda')) {
            touchInProgress = true;
            touchStartCell = cell;
            ratonPresionado = true;
            celdasSeleccionadas = [cell];
            cell.classList.add('seleccionada');
        }
    });

    // Evento de movimiento durante el toque
    cuadricula.addEventListener('touchmove', (e) => {
        if (!touchInProgress) return;

        const touch = e.touches[0];
        const cell = document.elementFromPoint(touch.clientX, touch.clientY);

        if (cell && cell.classList.contains('celda')) {
            const filaInicial = parseInt(touchStartCell.dataset.fila);
            const columnaInicial = parseInt(touchStartCell.dataset.columna);
            const filaActual = parseInt(cell.dataset.fila);
            const columnaActual = parseInt(cell.dataset.columna);

            // Limpiar selecciones previas
            document.querySelectorAll('.seleccionada').forEach(selectedCell => {
                if (!celdasEncontradas.has(selectedCell)) {
                    selectedCell.classList.remove('seleccionada');
                }
            });

            celdasSeleccionadas = [];

            const difFila = filaActual - filaInicial;
            const difColumna = columnaActual - columnaInicial;
            const pasos = Math.max(Math.abs(difFila), Math.abs(difColumna));

            if (pasos === 0) {
                celdasSeleccionadas = [touchStartCell];
            } else {
                const pasoFila = difFila / pasos;
                const pasoColumna = difColumna / pasos;

                for (let i = 0; i <= pasos; i++) {
                    const fila = Math.round(filaInicial + (pasoFila * i));
                    const columna = Math.round(columnaInicial + (pasoColumna * i));
                    const cell = document.querySelector(`.celda[data-fila="${fila}"][data-columna="${columna}"]`);
                    if (cell) {
                        celdasSeleccionadas.push(cell);
                        cell.classList.add('seleccionada');
                    }
                }
            }
        }
    });

    // Evento de finalización de toque
    cuadricula.addEventListener('touchend', () => {
        if (touchInProgress) {
            touchInProgress = false;
            ratonPresionado = false;
            const palabra = obtenerPalabraSeleccionada();
            verificarPalabra(palabra);

            celdasSeleccionadas.forEach(celda => {
                if (!celdasEncontradas.has(celda)) {
                    celda.classList.remove('seleccionada');
                }
            });
            celdasSeleccionadas = [];
            touchStartCell = null;
        }
    });
});


function agregarPalabra() {
    const entrada = document.getElementById('entradaPalabra');
    const palabra = entrada.value.trim().toUpperCase();
    
    if (palabras.length >= maximoPalabras) {
        alert(`No puedes agregar más palabras`);
        return;
    }
    
    if (palabra.length < 3) {
        alert('La palabra debe tener al menos 3 letras');
        return;
    }
    
    if (palabra.length > tamañoCuadricula) {
        alert(`La palabra no puede tener más de ${tamañoCuadricula} letras`);
        return;
    }
    
    if (palabras.includes(palabra)) {
        alert('Esta palabra ya fue agregada');
        return;
    }
    
    if (palabra) {
        palabras.push(palabra);
        entrada.value = '';
        actualizarListaPalabras();
        actualizarBotonGenerar();
        
        const restantes = maximoPalabras - palabras.length;
        if (restantes === 1) {
            alert('Solo puedes agregar una palabra más');
        } else if (restantes === 0) {
            alert('Has alcanzado el límite máximo de palabras');
        }
    }
}

function actualizarBotonGenerar() {
    const botonGenerar = document.getElementById('botonGenerar');
    botonGenerar.disabled = palabras.length === 0;
}

function actualizarListaPalabras() {
    const listaPalabras = document.getElementById('listaPalabras');
    listaPalabras.innerHTML = '';
    palabras.forEach((palabra, indice) => {
        const elementoPalabra = document.createElement('div');
        elementoPalabra.className = 'palabra-item';
        if (palabrasEncontradas.has(palabra)) {
            elementoPalabra.classList.add('encontrada');
            elementoPalabra.style.backgroundColor = colores[indice % colores.length];
            elementoPalabra.style.color = 'white';
        }
        elementoPalabra.textContent = palabra;
        listaPalabras.appendChild(elementoPalabra);
    });
}

function generarSopa() {
    if (palabras.length === 0) {
        alert('Agrega al menos una palabra antes de generar la sopa de letras');
        return;
    }
    
    cuadricula = Array(tamañoCuadricula).fill().map(() => Array(tamañoCuadricula).fill(''));
    palabrasEncontradas.clear();
    celdasEncontradas.clear();
    
    palabras.forEach(palabra => {
        let colocada = false;
        let intentos = 0;
        const maximoIntentos = 100;
        
        while (!colocada && intentos < maximoIntentos) {
            if (intentarColocarPalabra(palabra)) {
                colocada = true;
            }
            intentos++;
        }
        
        if (!colocada) {
            alert(`No se pudo colocar la palabra "${palabra}". Intenta generar de nuevo.`);
        }
    });
    
    rellenarCeldasVacias();
    mostrarCuadricula();
    actualizarListaPalabras();
}

function intentarColocarPalabra(palabra) {
    const direcciones = [
        [0, 1],    // horizontal derecha
        [0, -1],   // horizontal izquierda
        [1, 0],    // vertical abajo
        [-1, 0],   // vertical arriba
        [1, 1],    // diagonal derecha abajo
        [-1, -1],  // diagonal izquierda arriba
        [1, -1],   // diagonal izquierda abajo
        [-1, 1]    // diagonal derecha arriba
    ];
    
    const direccionesAleatorias = direcciones.sort(() => Math.random() - 0.5);
    
    for (let dir of direccionesAleatorias) {
        let inicioX, inicioY;
        if (dir[0] === 0) { // horizontal
            inicioX = Math.floor(Math.random() * tamañoCuadricula);
            inicioY = dir[1] === 1 ? 0 : tamañoCuadricula - 1;
        } else if (dir[1] === 0) { // vertical
            inicioX = dir[0] === 1 ? 0 : tamañoCuadricula - 1;
            inicioY = Math.floor(Math.random() * tamañoCuadricula);
        } else { // diagonal
            inicioX = dir[0] === 1 ? 0 : tamañoCuadricula - 1;
            inicioY = dir[1] === 1 ? 0 : tamañoCuadricula - 1;
        }
        
        const inicio = { x: inicioX, y: inicioY };
        if (puedeColocarPalabra(palabra, inicio, dir)) {
            colocarPalabraEn(palabra, inicio, dir);
            return true;
        }
    }
    return false;
}

function puedeColocarPalabra(palabra, inicio, direccion) {
    const longitud = palabra.length;
    const posiciones = [];
    
    for (let i = 0; i < longitud; i++) {
        const x = inicio.x + i * direccion[0];
        const y = inicio.y + i * direccion[1];
        
        if (x < 0 || x >= tamañoCuadricula || y < 0 || y >= tamañoCuadricula) {
            return false;
        }
        
        if (cuadricula[x][y] && cuadricula[x][y] !== palabra[i]) {
            return false;
        }
        
        posiciones.push([x, y]);
    }
    
    return true;
}

function colocarPalabraEn(palabra, inicio, direccion) {
    for (let i = 0; i < palabra.length; i++) {
        const x = inicio.x + i * direccion[0];
        const y = inicio.y + i * direccion[1];
        cuadricula[x][y] = palabra[i];
    }
}

function rellenarCeldasVacias() {
    const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let i = 0; i < tamañoCuadricula; i++) {
        for (let j = 0; j < tamañoCuadricula; j++) {
            if (!cuadricula[i][j]) {
                cuadricula[i][j] = letras[Math.floor(Math.random() * letras.length)];
            }
        }
    }
}

function mostrarCuadricula() {
    const elementoCuadricula = document.getElementById('cuadricula');
    elementoCuadricula.innerHTML = '';
    elementoCuadricula.style.gridTemplateColumns = `repeat(${tamañoCuadricula}, 30px)`;
    
    for (let i = 0; i < tamañoCuadricula; i++) {
        for (let j = 0; j < tamañoCuadricula; j++) {
            const celda = document.createElement('div');
            celda.className = 'celda';
            celda.textContent = cuadricula[i][j];
            celda.dataset.fila = i;
            celda.dataset.columna = j;
            
            celda.style.border = '1px solid #2c3e50';
            
            celda.addEventListener('mousedown', iniciarSeleccion);
            celda.addEventListener('mousemove', actualizarSeleccion);
            celda.addEventListener('mouseup', finalizarSeleccion);
            
            elementoCuadricula.appendChild(celda);
        }
    }
}

function iniciarSeleccion(e) {
    ratonPresionado = true;
    celdasSeleccionadas = [e.target];
    e.target.classList.add('seleccionada');
}

function actualizarSeleccion(e) {
    if (!ratonPresionado) return;
    
    const celdaActual = e.target;
    if (!celdaActual.classList.contains('celda')) return;
    
    const celdaInicial = celdasSeleccionadas[0];
    const filaInicial = parseInt(celdaInicial.dataset.fila);
    const columnaInicial = parseInt(celdaInicial.dataset.columna);
    const filaActual = parseInt(celdaActual.dataset.fila);
    const columnaActual = parseInt(celdaActual.dataset.columna);
    
    celdasSeleccionadas.forEach(celda => {
        if (!celdasEncontradas.has(celda)) {
            celda.classList.remove('seleccionada');
        }
    });
    celdasSeleccionadas = [];
    
    const difFila = filaActual - filaInicial;
    const difColumna = columnaActual - columnaInicial;
    const pasos = Math.max(Math.abs(difFila), Math.abs(difColumna));
    
    if (pasos === 0) {
        celdasSeleccionadas = [celdaInicial];
    } else {
        const pasoFila = difFila / pasos;
        const pasoColumna = difColumna / pasos;
        
        for (let i = 0; i <= pasos; i++) {
            const fila = Math.round(filaInicial + (pasoFila * i));
            const columna = Math.round(columnaInicial + (pasoColumna * i));
            const celda = document.querySelector(`.celda[data-fila="${fila}"][data-columna="${columna}"]`);
            if (celda) {
                celdasSeleccionadas.push(celda);
                celda.classList.add('seleccionada');
            }
        }
    }
}

function finalizarSeleccion() {
    ratonPresionado = false;
    const palabra = obtenerPalabraSeleccionada();
    verificarPalabra(palabra);
    
    celdasSeleccionadas.forEach(celda => {
        if (!celdasEncontradas.has(celda)) {
            celda.classList.remove('seleccionada');
        }
    });
    celdasSeleccionadas = [];
}

function obtenerPalabraSeleccionada() {
    return celdasSeleccionadas.map(celda => celda.textContent).join('');
}

function verificarPalabra(palabraSeleccionada) {
    const palabraDirecta = palabraSeleccionada;
    const palabraInvertida = palabraSeleccionada.split('').reverse().join('');
    let indicePalabra = -1;
    
    if (palabras.includes(palabraDirecta)) {
        indicePalabra = palabras.indexOf(palabraDirecta);
        palabrasEncontradas.add(palabraDirecta);
        marcarPalabraEncontrada(indicePalabra);
    } else if (palabras.includes(palabraInvertida)) {
        indicePalabra = palabras.indexOf(palabraInvertida);
        palabrasEncontradas.add(palabraInvertida);
        marcarPalabraEncontrada(indicePalabra);
    }
    
    if (palabrasEncontradas.size === palabras.length) {
        mostrarFelicitaciones();
    }
}

function marcarPalabraEncontrada(indicePalabra) {
    const color = colores[indicePalabra % colores.length];
    celdasSeleccionadas.forEach(celda => {
        celda.classList.add('encontrada');
        celda.style.backgroundColor = color;
        celda.style.color = 'white';
        celdasEncontradas.set(celda, color);
    });
    actualizarListaPalabras();
}

function mostrarFelicitaciones() {
    const elementoFelicitaciones = document.createElement('div');
    elementoFelicitaciones.className = 'felicitaciones';
    elementoFelicitaciones.innerHTML = `
        <div class="contenido-felicitaciones">
            <h2>¡Felicitaciones!</h2>
            <p>Has encontrado todas las palabras</p>
            <button onclick="this.parentElement.parentElement.remove()">Cerrar</button>
        </div>
    `;
    document.body.appendChild(elementoFelicitaciones);
}

function mostrarAcercaDe() {
    alert('Generador de Sopa de Letras\n\n' +
          'Instrucciones:\n' +
          '1. Ingresa hasta 12 palabras que quieras encontrar (mínimo 3 letras)\n' +
          '2. Presiona "Agregar Palabra" o Enter para cada palabra\n' +
          '3. Una vez agregadas todas las palabras, presiona "Generar Sopa"\n' +
          '4. Encuentra las palabras arrastrando el mouse sobre ellas\n' +
          '5. Las palabras encontradas se marcarán con colores diferentes\n' +
          '6. Puedes imprimir la sopa de letras con el botón "Imprimir"');
}

function imprimirSopa() {
    window.print();
}