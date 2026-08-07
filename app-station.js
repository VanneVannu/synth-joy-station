// ===================================================
// 1. PROTOCOLO DE AUDIO NATIVO Y ECONOMÍA DE CRÉDITOS
// ===================================================
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let osciladorAmbiente = null;
let tieneCredito = false;
let contadorCreditosTotales = 0; // REPARADO: Ahora es un monedero acumulativo real

// Efecto de sonido retro "¡Clink!" de moneda + activación de la cabina
function insertarMoneda() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    // Sonido de moneda: Dos pitidos metálicos rápidos hacia arriba
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, audioCtx.currentTime); // Nota Si5
    osc.frequency.setValueAtTime(1318.51, audioCtx.currentTime + 0.08); // Nota Mi6 rápido
    
    gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.25);

    // CONTROL ECONÓMICO: Sumamos fichas reales al contador global
    contadorCreditosTotales++;
    tieneCredito = true;

    // Actualización visual en la marquesina superior
    const txtCreditos = document.getElementById('txt-creditos');
    txtCreditos.innerText = `CREDITS ${contadorCreditosTotales.toString().padStart(2, '0')}`;
    txtCreditos.classList.add('con-credito');
    
    // El botón se transforma en indicador de arranque de juego
    const btnAudio = document.getElementById('boton-audio');
    btnAudio.innerText = "🎮 PRESS START";
    btnAudio.classList.add('activo');
    
    // Enciende el ecualizador visual del gabinete
    document.getElementById('eq-luces').classList.add('animando');
    
    // Encender el zumbido Synth de fondo si no estaba encendido
    if (!osciladorAmbiente) {
        activarZumbidoSynth();
    }
}

function activarZumbidoSynth() {
    osciladorAmbiente = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osciladorAmbiente.type = 'sawtooth'; 
    osciladorAmbiente.frequency.setValueAtTime(55, audioCtx.currentTime); // Tono grave cyberpunk
    gainNode.gain.setValueAtTime(0.015, audioCtx.currentTime); // Volumen suave confortable
    
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(110, audioCtx.currentTime);

    osciladorAmbiente.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    osciladorAmbiente.start();
}

// Efecto de botón arcade al presionar un juego (Bloquea la salida si no hay moneda)
function sonarClick(event, elemento) {
    if (!tieneCredito || contadorCreditosTotales <= 0) {
        event.preventDefault(); // Evita que abra el juego si no echó ficha
        alert("🚨 INSERT COIN REQUIRED TO INITIALIZE VIRTUAL STAGE!");
        return;
    }

    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    // GASTO DE CRÉDITO: Restamos una moneda por cada partida iniciada
    contadorCreditosTotales--;
    const txtCreditos = document.getElementById('txt-creditos');
    txtCreditos.innerText = `CREDITS ${contadorCreditosTotales.toString().padStart(2, '0')}`;
    
    if (contadorCreditosTotales <= 0) {
        tieneCredito = false;
        document.getElementById('boton-audio').innerText = "🪙 INSERT COIN";
        document.getElementById('boton-audio').classList.remove('activo');
        txtCreditos.classList.remove('con-credito');
    }

    // Sonido clásico de disparo/inicio de juego láser
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.3); // Cae el tono
    
    gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
}

// ===================================================
// 2. REGISTRO DE PILOTOS Y MEMORIA DE PERFIL (LOCALSTORAGE)
// ===================================================
let avatarSeleccionadoActual = '🦊'; // Avatar por defecto

// Despierta la ventana emergente flotante neón
function abrirPanelConfigPerfil() {
    const modal = document.getElementById('modal-perfil-arcade');
    if (modal) {
        modal.classList.remove('oculto');
        // Si ya hay un alias guardado, lo pre-cargamos en la caja de texto
        const aliasGuardado = localStorage.getItem('arcade_pilot_name');
        if (aliasGuardado) {
            document.getElementById('input-perfil-alias').value = aliasGuardado;
        }
    }
}

// Guarda temporalmente el emoji del zorro, robot, etc., al hacerle clic
function seleccionarAvatarLocal(emoji) {
    avatarSeleccionadoActual = emoji;
    
    // Feedback visual rápido: quitamos la clase activa a todos y se la ponemos al elegido
    const avatares = document.querySelectorAll('.avatar-pixel');
    avatares.forEach(av => av.style.borderColor = 'transparent');
    
    // Buscamos el elemento que contiene el emoji para remarcarlo con neón
    event.target.style.borderColor = '#00ff66';
    sonarTonoMiniRetro(800, 0.04); // Pitido ultra rápido de selección
}

// Sella el perfil de forma permanente en el disco duro del navegador
function guardarPerfilPilotoLocal() {
    const input = document.getElementById('input-perfil-alias');
    const aliasLimpio = input.value.trim().toUpperCase() || 'PILOT_X';

    // Guardamos en LocalStorage
    localStorage.setItem('arcade_pilot_name', aliasLimpio);
    localStorage.setItem('arcade_pilot_avatar', avatarSeleccionadoActual);

    // Actualizamos las etiquetas de la marquesina superior en tiempo real
    document.getElementById('label-pilot-name').innerText = `${aliasLimpio} ${avatarSeleccionadoActual}`;

    // Cerramos el modal neón visualmente
    document.getElementById('modal-perfil-arcade').classList.add('oculto');
    
    // Tono retro ascendente de confirmación exitosa
    sonarTonoMiniRetro(600, 0.08);
    setTimeout(() => sonarTonoMiniRetro(900, 0.1), 80);
}

// FUNCIÓN DE ARRANQUE DE SEGURIDAD (AUTO-RUN)
// Cuando el usuario entra a la web, revisa si ya tiene un perfil viejo creado para cargarlo solo
function verificarPerfilAlCargarPagina() {
    const aliasGuardado = localStorage.getItem('arcade_pilot_name');
    const avatarGuardado = localStorage.getItem('arcade_pilot_avatar');

    if (aliasGuardado && avatarGuardado) {
        avatarSeleccionadoActual = avatarGuardado;
        document.getElementById('label-pilot-name').innerText = `${aliasGuardado} ${avatarGuardado}`;
    } else {
        // Si es la primera vez que entra, le dejamos el nombre base con el zorro neón
        document.getElementById('label-pilot-name').innerText = "GUEST_USER 🦊";
    }
}

// Pitido auxiliar rápido exclusivo para la interfaz de los botones del menú
function sonarTonoMiniRetro(frecuencia, duracion) {
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(frecuencia, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duracion);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duracion);
    } catch(e) {}
}

// Ejecutamos la revisión de memoria en cuanto el archivo se monta en la cabina
setTimeout(verificarPerfilAlCargarPagina, 200);

// ===================================================
// 3. TERMINAL DE FEEDBACK, BUG REPORTS Y LOGS ARCADE
// ===================================================

// Controla el contador de bytes dinámico estilo consola militar
function actualizarContadorBytes() {
    const textarea = document.getElementById('texto-feedback-usuario');
    const contador = document.getElementById('char-counter-feedback');
    if (textarea && contador) {
        const bytesUsados = textarea.value.length;
        contador.innerText = `${bytesUsados} / 250 BYTES`;
        
        // Efecto cosmético: si se acerca al límite, pintamos el texto de advertencia
        if (bytesUsados >= 220) {
            contador.style.color = '#ffcc00'; // Amarillo de advertencia
        } else {
            contador.style.color = 'rgba(0, 255, 102, 0.5)'; // Verde fósforo estándar
        }
    }
}

// Inyecta el texto del operador directamente en la pantalla de logs simulada
function inyectarOpinionLocal() {
    const textarea = document.getElementById('texto-feedback-usuario');
    const opinion = textarea.value.trim();
    
    if (!opinion) {
        sonarTonoMiniRetro(150, 0.15); // Zumbido de error grave
        alert("🚨 TERMINAL ERROR: FEEDBACK BUFFER EMPTY.");
        return;
    }

    // Capturamos el alias actual desde la memoria del perfil o el HUD
    const aliasPiloto = localStorage.getItem('arcade_pilot_name') || 'GUEST_USER';
    const avatarPiloto = localStorage.getItem('arcade_pilot_avatar') || '🦊';
    
    // Dibuja el log con un formato estricto de la máquina recreativa
    const listaLogs = document.getElementById('lista-logs-opiniones');
    const nuevoLog = document.createElement('div');
    nuevoLog.className = 'log-item user-log';
    
    // Formateamos la hora en estilo de terminal militar [HH:MM:SS]
    const ahora = new Date();
    const marcaTiempo = `[${ahora.getHours().toString().padStart(2, '0')}:${ahora.getMinutes().toString().padStart(2, '0')}:${ahora.getSeconds().toString().padStart(2, '0')}]`;
    
    nuevoLog.innerHTML = `<span style="color: #ffcc00;">${marcaTiempo}</span> <span style="color: #00ff66;">[${aliasPiloto}_${avatarPiloto}]:</span> ${opinion}`;
    
    // Inyectamos al inicio de la lista y deslizamos hacia abajo automáticamente
    listaLogs.appendChild(nuevoLog);
    listaLogs.scrollTop = listaLogs.scrollHeight;
    
    // Sonido clásico de transmisión de logs por satélite
    sonarTonoMiniRetro(900, 0.05);
    setTimeout(() => sonarTonoMiniRetro(1200, 0.05), 50);
    
    // Limpiamos el búfer del área de texto
    textarea.value = '';
    document.getElementById('char-counter-feedback').innerText = "0 / 250 BYTES";
    
    console.log("Infraestructura: Sugerencia inyectada con éxito en el sub-sistema local.");
}

// ===================================================
// 4. MOTOR COGNITIVO DEL COMPAÑERO IA: WHITE_RABBIT_CORE (CUALIDADES HÍBRIDAS)
// ===================================================
let consolaIaAbierta = false;

// Abre o cierra la consola del conejo holográfico con un pitido
function despertarVozIaCompanion() {
    const consola = document.getElementById('ia-consola-dialogo');
    const holograma = document.getElementById('ia-holograma-cuerpo');
    
    if (!consola) return;
    
    consolaIaAbierta = !consolaIaAbierta;
    sonarTonoMiniRetro(500, 0.05);

    if (consolaIaAbierta) {
        consola.className = "consola-ia-abierta";
        holograma.style.boxShadow = "0 0 25px #ffcc00"; // Alerta activa amarilla
        document.getElementById('ia-output-texto').innerText = "RABBIT_CORE_ONLINE: Follow the white rabbit... Interrogation lines open. Interrogate me.";
    } else {
        consola.className = "consola-ia-cerrada";
        holograma.style.boxShadow = "0 0 15px #00ff66"; // Regresa al verde fósforo
    }
}

function evaluarTeclaIa(e) { 
    if (e.key === 'Enter') procesarConsultaIaLocal(); 
}

// CEREBRO COGNITIVO BILINGÜE (DETECCIÓN AUTOMÁTICA ESPAÑOL / INGLÉS)
function procesarConsultaIaLocal() {
    const input = document.getElementById('input-query-ia');
    const output = document.getElementById('ia-output-texto');
    const query = input.value.trim().toLowerCase();
    
    if (!query) return;

    output.innerText = "DECODING_MATRIX_INPUT...";
    sonarTonoMiniRetro(300, 0.08);

    setTimeout(() => {
        // Mensaje de error de respaldo (Detecta si el usuario está intentando hablar en español o inglés)
        let esQueryEspanol = query.includes('hola') || query.includes('juego') || query.includes('como') || query.includes('que') || query.includes('moneda');
        let respuesta = esQueryEspanol 
            ? "ERROR_404: Comando o protocolo desconocido. Replantea tus líneas de interrogación."
            : "ERROR_404: Command or protocol unknown. Rephrase your interrogation lines.";

        // ==========================================
        // DICCIONARIO BLOQUE A: RESPUESTAS EN ESPAÑOL
        // ==========================================
        if (query.includes('hola') || query.includes('saludo') || query.includes('quien eres') || query.includes('quién eres')) {
            respuesta = "RESPUESTA: Soy WHITE_RABBIT_CORE v1.0. Una matriz cognitiva artificial programada para monitorear Synth Joy Station. Te vigilo como un gato, te escaneo como un cuervo, te guío como un conejo y defiendo este gabinete como un tiburón.";
        } 
        else if (query.includes('chess') || query.includes('ajedrez')) {
            respuesta = "DATOS_STAGE_01 (ESCANEO_CUERVO): Cyber Chess detectado. Una zona de guerra táctica de vectores. Desplegar tu rejilla de batalla requiere de 01 moneda.";
        } 
        else if (query.includes('maze') || query.includes('laberinto') || query.includes('hack')) {
            respuesta = "DATOS_STAGE_02 (OJO_GATO): Neon Hack Maze cargado. Encriptación procedural de 21x21. Puedo ver a través de la niebla de guerra como un felino en la oscuridad. Optimiza tus dados.";
        } 
        else if (query.includes('pong')) {
            respuesta = "DATOS_STAGE_03 (MURO_TIBURÓN): Cyber Pong Neon está actualmente bajo mantenimiento de hardware. No presiones el núcleo; nuestros buffers de red están re-alineando coordenadas locales.";
        } 
        else if (query.includes('credito') || query.includes('moneda') || query.includes('coin') || query.includes('jugar') || query.includes('fichas')) {
            respuesta = "PROTOCOLO_ECONÓMICO (MADRIGUERA_CONEJO): Presiona el botón [INSERT COIN] para añadir fichas. Alimenta la máquina para ver qué tan profunda es la madriguera de este sistema.";
        }
        else if (query.includes('invaders') || query.includes('juego 2') || query.includes('proximo') || query.includes('próximo')) {
            respuesta = "PRÓXIMO_STAGE (MODO_DEPREDADOR): Glitch Invaders se está compilando en el segmento 04. Prepara tu cañón láser para devorar bugs maliciosos como un tiburón en el ciberespacio.";
        }

        // ==========================================
        // DICCIONARIO BLOQUE B: RESPUESTAS EN INGLÉS
        // ==========================================
        else if (query.includes('hello') || query.includes('hi ') || query.includes('who are you')) {
            respuesta = "REPLY: I am WHITE_RABBIT_CORE v1.0. A composite cognitive matrix. I watch you like a cat, scan you like a raven, guide you like a rabbit, and defend this station like a shark.";
        } 
        else if (query.includes('play')) {
            respuesta = "ECONOMY_PROTOCOL (RABBIT_HOLE): Push [INSERT COIN] to add tokens. Feed the machine to see how deep the hacker rabbit hole goes.";
        }
        else if (query.includes('next game') || query.includes('upcoming')) {
            respuesta = "UPCOMING_STAGE (PREDATOR_MODE): Glitch Invaders is compiling in segment 04. Prepare your digital cannon to devour malicious bugs like a shark in cyberspace.";
        }

        output.innerText = respuesta;
        sonarTonoMiniRetro(700, 0.06); 
        input.value = '';
    }, 400); 
}


// BUCLE DE MOVIMIENTOS ALEATORIOS PROCEDURALES (HABILIDADES DE LAS 4 ESPECIES)
function iniciarAnimacionesAleatoriasIa() {
    setInterval(() => {
        const rostro = document.getElementById('ia-rostro-pixel');
        if (!rostro || consolaIaAbierta) return; 

        const numeroAzar = Math.random();

        if (numeroAzar > 0.80) {
            // HABILIDAD 1: CONEJO CRÍPTICO (Glitch de Calavera Secreta de Matrix)
            rostro.innerText = "💀";
            setTimeout(() => { rostro.innerText = "🐰"; }, 180); // Parpadeo ultra rápido imperceptible
        } else if (numeroAzar > 0.60) {
            // HABILIDAD 2: GATO DE NEÓN (Feedback de relamido/guiño misterioso)
            rostro.innerText = "👅";
            setTimeout(() => { rostro.innerText = "🐰"; }, 500);
        } else if (numeroAzar > 0.40) {
            // HABILIDAD 3: CUERVO RADAR (Ojos de escaneo perimetral militar)
            rostro.innerText = "👁️";
            setTimeout(() => { rostro.innerText = "🐰"; }, 700);
        } else if (numeroAzar > 0.20) {
            // HABILIDAD 4: TIBURÓN DE LA DEEP WEB (Fauces de ataque y alerta roja)
            rostro.innerText = "🦈";
            const holograma = document.getElementById('ia-holograma-cuerpo');
            if (holograma) holograma.style.borderColor = "#ff3333"; // Se pone rojo de peligro por un instante
            setTimeout(() => { 
                rostro.innerText = "🐰"; 
                if (holograma) holograma.style.borderColor = "#00ff66";
            }, 400);
        }
    }, 2500); // Reduce el tiempo a 2.5s para que el conejo se note sumamente activo, errático y vivo
}

iniciarAnimacionesAleatoriasIa();
