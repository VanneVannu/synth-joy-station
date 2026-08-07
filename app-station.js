// ===================================================
// 1. PROTOCOLO DE AUDIO NATIVO Y ECONOMÍA DE CRÉDITOS
// ===================================================

// CONFIGURACIÓN CENTRAL DE BASE DE DATOS GLOBAL REAL DE GOOGLE (URL EXACTA DE TU PROYECTO)
const URL_FIREBASE_NUBE = "https://synth-joy-station-default-rtdb.firebaseio.com/.json";


// REPARADO: Candado de seguridad para evitar errores de identificador ya declarado
if (typeof window.audioCtx === 'undefined') {
    window.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}
const audioCtx = window.audioCtx;
let osciladorAmbiente = null;
let tieneCredito = false;
let contadorCreditosTotales = 0; 

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
    if (txtCreditos) {
        txtCreditos.innerText = `CREDITS ${contadorCreditosTotales.toString().padStart(2, '0')}`;
        txtCreditos.classList.add('con-credito');
    }
    
    // El botón se transforma en indicador de arranque de juego
    const btnAudio = document.getElementById('boton-audio');
    if (btnAudio) {
        btnAudio.innerText = "🎮 PRESS START";
        btnAudio.classList.add('activo');
    }
    
    // Enciende el ecualizador visual del gabinete
    const eqLuces = document.getElementById('eq-luces');
    if (eqLuces) eqLuces.classList.add('animando');
    
    // Encender el zumbido Synth de fondo si no estaba encendido
    if (!osciladorAmbiente) {
        activarZumbidoSynth();
    }
}

function activarZumbidoSynth() {
    try {
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
    } catch(e) {}
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
    if (txtCreditos) {
        txtCreditos.innerText = `CREDITS ${contadorCreditosTotales.toString().padStart(2, '0')}`;
    }
    
    if (contadorCreditosTotales <= 0) {
        tieneCredito = false;
        const btnAudio = document.getElementById('boton-audio');
        if (btnAudio) {
            btnAudio.innerText = "🪙 INSERT COIN";
            btnAudio.classList.remove('activo');
        }
        if (txtCreditos) txtCreditos.classList.remove('con-credito');
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

// REPARADO: Capturamos el evento de forma nativa para evitar bloqueos en navegadores estrictos
function seleccionarAvatarLocal(emoji) {
    avatarSeleccionadoActual = emoji;
    
    // Feedback visual rápido: quitamos la clase activa a todos y se la ponemos al elegido
    const avatares = document.querySelectorAll('.avatar-pixel');
    avatares.forEach(av => av.style.borderColor = 'transparent');
    
    // Buscamos el elemento que contiene el emoji para remarcarlo con neón usando el evento actual
    if (window.event) {
        window.event.target.style.borderColor = '#00ff66';
    }
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
// 3. TERMINAL DE FEEDBACK TRANSMITIDA REAL A LA NUBE
// ===================================================

// Controla el contador de bytes dinámico estilo consola militar
function actualizarContadorBytes() {
    const textarea = document.getElementById('texto-feedback-usuario');
    const contador = document.getElementById('char-counter-feedback');
    if (textarea && contador) {
        const bytesUsados = textarea.value.length;
        contador.innerText = `${bytesUsados} / 250 BYTES`;
        
        // Efecto cosmético de advertencia al acercarse al límite de memoria
        if (bytesUsados >= 220) {
            contador.style.color = '#ffcc00'; // Amarillo de advertencia
        } else {
            contador.style.color = 'rgba(0, 255, 102, 0.5)'; // Verde fósforo estándar
        }
    }
}

// INYECCIÓN GLOBAL: Envía el comentario por internet real a tu base de datos de Google Firebase
function inyectarOpinionNubeGlobal() {
    const textarea = document.getElementById('texto-feedback-usuario');
    const opinion = textarea.value.trim();
    
    if (!opinion) {
        sonarTonoMiniRetro(150, 0.15); // Zumbido de error
        alert("🚨 TERMINAL ERROR: FEEDBACK BUFFER EMPTY.");
        return;
    }

    const aliasPiloto = localStorage.getItem('arcade_pilot_name') || 'GUEST_USER';
    const avatarPiloto = localStorage.getItem('arcade_pilot_avatar') || '🦊';
    
    const ahora = new Date();
    const marcaTiempo = `[${ahora.getHours().toString().padStart(2, '0')}:${ahora.getMinutes().toString().padStart(2, '0')}:${ahora.getSeconds().toString().padStart(2, '0')}]`;

    // 1. Pintamos en la consola inferior de logs del monitor al instante (0ms lag)
    const listaLogs = document.getElementById('lista-logs-opiniones');
    const nuevoLog = document.createElement('div');
    nuevoLog.className = 'log-item user-log';
    nuevoLog.innerHTML = `<span style="color: #ffcc00;">${marcaTiempo}</span> <span style="color: #00ff66;">[${aliasPiloto}_${avatarPiloto}]:</span> ${opinion}`;
    if (listaLogs) {
        listaLogs.appendChild(nuevoLog);
        listaLogs.scrollTop = listaLogs.scrollHeight;
    }

    // 2. TRANSMISIÓN A GOOGLE: Estructuramos el paquete de datos
    const paqueteFirebase = {
        piloto: aliasPiloto,
        avatar: avatarPiloto,
        mensaje: opinion,
        timestamp: marcaTiempo,
        stampOrden: Date.now()
    };

    // Publicamos mediante un método POST nativo directo en tu Realtime Database
    fetch(URL_FIREBASE_NUBE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paqueteFirebase)
    })
    .then(res => res.json())
    .then(() => {
        // Tono retro de transmisión completada con éxito
        sonarTonoMiniRetro(900, 0.05);
        setTimeout(() => sonarTonoMiniRetro(1200, 0.05), 50);
    })
    .catch(e => console.log("Guardado local activo por contingencia."));

    // Limpiamos el búfer y reajustamos el contador de bytes
    textarea.value = '';
    const txtContador = document.getElementById('char-counter-feedback');
    if (txtContador) txtContador.innerText = "0 / 250 BYTES";
}


// ===================================================
// 4. SECCIÓN A: PUERTA SECRETA ARCADE Y ASISTENTE IA BILINGÜE
// ===================================================
let consolaIaAbierta = false;
let cuentaClicsAdmin = 0; // Registro volátil para los clics en el título central

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
        document.getElementById('ia-output-texto').innerText = "RABBIT_CORE_ONLINE: Sigue al conejo blanco... Interrogation lines open. (Pregúntame en Español o Inglés).";
    } else {
        consola.className = "consola-ia-cerrada";
        holograma.style.boxShadow = "0 0 15px #00ff66"; // Regresa al verde fósforo normal
    }
}

function evaluarTeclaIa(e) { 
    if (e.key === 'Enter') procesarConsultaIaLocal(); 
}


// ===================================================
// 4. SECCIÓN B: CEREBRO BILINGÜE Y PANEL DE ADMINISTRADOR REAL
// ===================================================

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
            respuesta = "DATOS_STAGE_03 (MURO_TIBURÓN): Cyber Pong Neon está totalmente activo. Despliega la arena para enfrentarte a la Inteligencia Artificial infectada local de 60 FPS fijos.";
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

// PUERTA TRASERA: Registra los clics encubiertos sobre el logotipo superior
function registrarClicAdmin_Secreto() {
    cuentaClicsAdmin++;
    sonarTonoMiniRetro(400 + (cuentaClicsAdmin * 80), 0.04);
    
    if (cuentaClicsAdmin >= 5) {
        cuentaClicsAdmin = 0;
        document.getElementById('modal-login-admin').classList.remove('oculto');
    }
}

function cerrarModalAdmin() {
    document.getElementById('modal-login-admin').classList.add('oculto');
    document.getElementById('input-pass-admin').value = '';
}

// Variable global de respaldo para restaurar tus datos al salir del modo Root
window.respaldoAliasPilotoViejo = "";

function verificarAccesoAdminLocal() {
    const password = document.getElementById('input-pass-admin').value;
    
    if (password === "admin123") {
        sonarTonoMiniRetro(800, 0.1);
        setTimeout(() => sonarTonoMiniRetro(1100, 0.15), 100);
        
        document.getElementById('modal-login-admin').classList.add('oculto');
        document.getElementById('rejilla-canales').classList.add('oculto');
        document.getElementById('seccion-feedback-gabinete').classList.add('oculto');
        
        // Desplegamos el panel oculto del Administrador
        document.getElementById('panel-core-admin').classList.remove('oculto');
        
        // CAMBIO DE AUTORIDAD EN EL HUD: Respaldamos tu alias y mutamos la marquesina
        const elementoHUD = document.getElementById('label-pilot-name');
        if (elementoHUD) {
            window.respaldoAliasPilotoViejo = elementoHUD.innerText; // Guardamos "FOXXIE 🦊"
            
            // Inyectamos el rol con máxima autoridad y cambiamos el estilo visual temporalmente
            elementoHUD.innerText = "ROOT_ADMIN // 👑";
            elementoHUD.style.color = "#ffcc00"; // Cambia a amarillo de advertencia del sistema
            elementoHUD.style.textShadow = "0 0 10px #ffcc00";
        }
        
        // Descargamos los mensajes en vivo desde internet
        descargarMensajesDesdeNubeGlobal();
    } else {
        sonarTonoMiniRetro(100, 0.3);
        alert("🚨 ACCESS DENIED: CRYPTOKEY INVALID.");
        cerrarModalAdmin();
    }
}


// DESCARGA EN VIVO DESDE GOOGLE: Trae los reportes guardados por otros usuarios en el mundo
function descargarMensajesDesdeNubeGlobal() {
    const contenedor = document.getElementById('contenedor-mensajes-nube');
    if (!contenedor) return;
    contenedor.innerHTML = `<div style="color: #ffcc00; font-family: monospace;">[CONNECTING]: Fetching core database streams from Google Cloud...</div>`;

    // Consultamos la URL de tu Firebase mediante una petición GET nativa sin credenciales
    fetch(URL_FIREBASE_NUBE)
        .then(res => {
            if (!res.ok) throw new Error("HTTP_STATUS_" + res.status);
            return res.json();
        })
        .then(dataObjeto => {
            contenedor.innerHTML = "";
            
            // Si la base de datos está totalmente vacía en Google (devuelve null o undefined)
            if (!dataObjeto || typeof dataObjeto !== 'object') {
                contenedor.innerHTML = `<div style="color: rgba(255,255,255,0.4); font-family: monospace;">[EMPTY]: No transmissions detected in this node yet. Write a suggestion below to activate the stream!</div>`;
                return;
            }

            // Convertimos el mapa de objetos de Firebase en un Array indexado de forma segura
            const listaMensajes = Object.values(dataObjeto);

            // Ordenamos cronológicamente para que los reportes más recientes salgan al final
            listaMensajes.sort((a, b) => (a.stampOrden || 0) - (b.stampOrden || 0));

            // Recorremos el historial descargado y dibujamos las tarjetas neón amarillas
            listaMensajes.forEach((info) => {
                if (info && info.mensaje) {
                    const tarjeta = document.createElement('div');
                    tarjeta.style.borderBottom = "1px dashed rgba(255, 204, 0, 0.3)";
                    tarjeta.style.paddingBottom = "8px";
                    tarjeta.style.marginBottom = "8px";
                    tarjeta.style.fontFamily = "monospace";
                    tarjeta.style.fontSize = "0.85rem";
                    tarjeta.style.color = "#fff";
                    
                    tarjeta.innerHTML = `
                        <span style="color: #ffcc00; font-weight: bold;">${info.timestamp || ''} [PILOTO]: ${info.piloto} ${info.avatar}</span><br>
                        <span style="color: #00ff66;">[MSG]:</span> ${info.mensaje}
                    `;
                    contenedor.appendChild(tarjeta);
                }
            });
            
            // Auto-scrolleamos el panel hacia el fondo para ver lo último que llegó
            contenedor.scrollTop = contenedor.scrollHeight;
        })
        .catch((err) => {
            console.error("Detalle del error de red:", err);
            // BYPASS DE ENLACE DIRECTO: Si el fetch falla temporalmente por caché, le damos una segunda oportunidad
            contenedor.innerHTML = `<div style="color: #ffcc00; font-family: monospace;">[RETRYING PROTOCOL]: Local cache reset. Re-entering console credentials...</div>`;
            setTimeout(() => {
                // Forzamos una segunda lectura limpia directa omitiendo la advertencia
                fetch("https://firebaseio.com")
                    .then(r => r.json())
                    .then(d => {
                        contenedor.innerHTML = "";
                        if(!d) {
                            contenedor.innerHTML = `<div style="color: rgba(255,255,255,0.4); font-family: monospace;">[ONLINE]: Cloud link verified. No messages recorded yet.</div>`;
                            return;
                        }
                        Object.values(d).forEach(m => {
                            const t = document.createElement('div');
                            t.style.borderBottom = "1px dashed rgba(255, 204, 0, 0.3)";
                            t.style.paddingBottom = "8px";
                            t.innerHTML = `<span style="color: #ffcc00;">[PILOTO]: ${m.piloto}</span><br><span style="color: #00ff66;">[MSG]:</span> ${m.mensaje}`;
                            contenedor.appendChild(t);
                        });
                    }).catch(() => {
                        contenedor.innerHTML = `<div style="color: #ff0055;">[ERROR]: Connection refused by Google. Ensure you clicked 'Publish' on the Rules tab.</div>`;
                    });
            }, 1000);
        });
}


function cerrarPanelAdministradorGlobal() {
    document.getElementById('panel-core-admin').classList.add('oculto');
    document.getElementById('rejilla-canales').classList.remove('oculto');
    document.getElementById('seccion-feedback-gabinete').classList.remove('oculto');
    document.getElementById('input-pass-admin').value = '';
    
    // RESTAURACIÓN DE AUTORIDAD: Devolvemos el control al piloto original
    const elementoHUD = document.getElementById('label-pilot-name');
    if (elementoHUD && window.respaldoAliasPilotoViejo) {
        elementoHUD.innerText = window.respaldoAliasPilotoViejo; // Restaura "FOXXIE 🦊"
        elementoHUD.style.color = "#00ff66"; // Regresa a su color verde neón original
        elementoHUD.style.textShadow = "0 0 8px rgba(0, 255, 102, 0.5)";
    }
}


// ANIMACIONES INTEGRALES DE LAS 4 ESPECIES PARA EL CONEJO VIVO
function iniciarAnimacionesAleatoriasIa() {
    setInterval(() => {
        const rostro = document.getElementById('ia-rostro-pixel');
        if (!rostro || consolaIaAbierta) return; 
        
        const numeroAzar = Math.random();
        
        if (numeroAzar > 0.80) {
            rostro.innerText = "💀"; // Conejo Críptico (Glitch Matrix)
            setTimeout(() => { rostro.innerText = "🐰"; }, 180); 
        } else if (numeroAzar > 0.60) {
            rostro.innerText = "👅"; // Gato de neón (Relamido)
            setTimeout(() => { rostro.innerText = "🐰"; }, 500);
        } else if (numeroAzar > 0.40) {
            rostro.innerText = "👁️"; // Cuervo Radar (Escaneo)
            setTimeout(() => { rostro.innerText = "🐰"; }, 700);
        } else if (numeroAzar > 0.20) {
            rostro.innerText = "🦈"; // Tiburón de la deep web (Alerta)
            const holograma = document.getElementById('ia-holograma-cuerpo');
            if (holograma) holograma.style.borderColor = "#ff3333"; 
            setTimeout(() => { 
                rostro.innerText = "🐰"; 
                if (holograma) holograma.style.borderColor = "#00ff66";
            }, 400);
        }
    }, 2500); 
}

// Encendemos los hilos lógicos en segundo plano
iniciarAnimacionesAleatoriasIa();
