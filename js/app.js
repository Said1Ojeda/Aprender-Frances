"use strict";
// la app completa, pantallas, lecciones y progreso guardado en el navegador
(() => {
    function $(id) {
        const el = document.getElementById(id);
        if (!el)
            throw new Error('falta #' + id + ' en el html');
        return el;
    }
    function crear(tag, clase = '', texto) {
        const el = document.createElement(tag);
        if (clase)
            el.className = clase;
        if (texto !== undefined)
            el.textContent = texto;
        return el;
    }
    const azar = (lista) => lista[Math.floor(Math.random() * lista.length)];
    function revolver(lista) {
        const r = lista.slice();
        for (let i = r.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [r[i], r[j]] = [r[j], r[i]];
        }
        return r;
    }
    // progreso guardado
    const CLAVE = 'allez';
    const nuevoProgreso = () => ({ unidades: {}, tarjetas: {}, voz: true, xp: 0, racha: 0, ultimoDia: '', xpHoy: { dia: '', xp: 0 }, meta: 30, vozLenta: false });
    function leerProgreso() {
        const base = nuevoProgreso();
        try {
            const guardado = JSON.parse(localStorage.getItem(CLAVE) || '{}');
            return Object.assign(base, guardado);
        }
        catch (e) {
            return base;
        }
    }
    const progreso = leerProgreso();
    Voz.velocidad(progreso.vozLenta);
    function guardar() {
        try {
            localStorage.setItem(CLAVE, JSON.stringify(progreso));
        }
        catch (e) { }
    }
    // experiencia, niveles y racha
    const XP_POR_NIVEL = 100;
    // una leccion da entre 10 y 25 xp, con 18 se calcula mas o menos cuantas faltan
    const METAS = [
        { xp: 10, nombre: 'Relajada', detalle: 'Una lección corta' },
        { xp: 30, nombre: 'Normal', detalle: 'Unas dos lecciones' },
        { xp: 50, nombre: 'En serio', detalle: 'Unas tres lecciones' },
        { xp: 80, nombre: 'Intensa', detalle: 'Cuatro o cinco lecciones' }
    ];
    const meta = () => progreso.meta || 30;
    const nivel = () => Math.floor(progreso.xp / XP_POR_NIVEL) + 1;
    const xpDeHoy = () => progreso.xpHoy.dia === Repaso.dia() ? progreso.xpHoy.xp : 0;
    // si ayer no practicaste la racha ya se perdio aunque el numero siga guardado
    const rachaViva = () => progreso.ultimoDia === Repaso.dia() || progreso.ultimoDia === Repaso.dia(-1) ? progreso.racha : 0;
    // devuelve true si hoy es el primer dia que suma a la racha
    function sumarDia(xp) {
        const hoy = Repaso.dia();
        progreso.xp += xp;
        progreso.xpHoy = { dia: hoy, xp: xpDeHoy() + xp };
        if (progreso.ultimoDia === hoy)
            return false;
        progreso.racha = progreso.ultimoDia === Repaso.dia(-1) ? progreso.racha + 1 : 1;
        progreso.ultimoDia = hoy;
        return true;
    }
    function mostrar(p) {
        document.querySelectorAll('.pantalla').forEach(s => s.classList.toggle('activa', s.id === 'p-' + p));
        document.body.dataset.pantalla = p;
        window.scrollTo(0, 0);
    }
    document.querySelectorAll('[data-ir]').forEach(b => b.addEventListener('click', () => {
        if (b.dataset.ir === 'inicio')
            irInicio();
        else if (b.dataset.ir === 'palabras')
            irPalabras();
        else if (b.dataset.ir === 'ajustes')
            irAjustes();
    }));
    // inicio
    const desbloqueada = (i) => i === 0 || (progreso.unidades[UNIDADES[i - 1].id]?.veces ?? 0) > 0;
    function estrellas(mejor) {
        const cuantas = mejor === undefined ? 0 : mejor >= 1 ? 3 : mejor >= .8 ? 2 : 1;
        const caja = crear('span', 'estrellas');
        caja.setAttribute('aria-label', cuantas + ' de 3 estrellas');
        for (let k = 0; k < 3; k++)
            caja.appendChild(crear('span', k < cuantas ? '' : 'apagada', '★'));
        return caja;
    }
    function irInicio() {
        const hora = new Date().getHours();
        $('saludo').textContent = hora >= 18 || hora < 5 ? 'Bonsoir' : 'Bonjour';
        const camino = $('camino');
        camino.replaceChildren(...UNIDADES.map((u, i) => {
            const li = crear('li');
            const b = crear('button', 'unidad');
            b.type = 'button';
            b.style.setProperty('--c', u.color);
            const abierta = desbloqueada(i);
            b.disabled = !abierta;
            b.appendChild(crear('span', 'unidad-num', String(i + 1)));
            b.appendChild(crear('h2', '', u.titulo));
            b.appendChild(crear('span', 'fr', u.tituloFr));
            b.appendChild(crear('p', '', abierta ? u.descripcion : 'Termina la unidad anterior para abrirla.'));
            const pie = crear('span', 'unidad-pie');
            const avance = progreso.unidades[u.id];
            pie.appendChild(crear('span', '', avance ? 'Practicada ' + avance.veces + (avance.veces === 1 ? ' vez' : ' veces') : u.palabras.length + ' palabras'));
            pie.appendChild(estrellas(avance?.mejor));
            b.appendChild(pie);
            b.addEventListener('click', () => empezar(u));
            li.appendChild(b);
            return li;
        }));
        pintarTablero();
        pintarRepaso();
        pintarIndicadores();
        mostrar('inicio');
    }
    function barra(pct, clase = '') {
        const b = crear('div', 'barrita ' + clase);
        const i = crear('i');
        i.style.width = Math.min(100, Math.round(pct * 100)) + '%';
        b.appendChild(i);
        return b;
    }
    function pintarTablero() {
        const hoy = xpDeHoy();
        const racha = rachaViva();
        const enNivel = progreso.xp % XP_POR_NIVEL;
        const tarjeta = (titulo, valor, detalle, avance) => {
            const t = crear('div', 'marcador');
            t.append(crear('span', 'marcador-titulo', titulo), crear('b', '', valor));
            if (avance)
                t.appendChild(avance);
            t.appendChild(crear('span', 'marcador-detalle', detalle));
            return t;
        };
        $('tablero').replaceChildren(tarjeta('Racha', '🔥 ' + racha + (racha === 1 ? ' día' : ' días'), racha && progreso.ultimoDia !== Repaso.dia() ? 'Practica hoy para no perderla' : racha ? 'Hoy ya cuenta' : 'Haz una lección para empezarla'), tarjeta('Meta de hoy', Math.min(hoy, meta()) + ' / ' + meta() + ' XP', hoy >= meta() ? '¡Cumplida, très bien!' : faltan(meta() - hoy), barra(hoy / meta(), 'meta')), tarjeta('Nivel ' + nivel(), progreso.xp + ' XP', (XP_POR_NIVEL - enNivel) + ' XP para el nivel ' + (nivel() + 1), barra(enNivel / XP_POR_NIVEL)), tarjeta('Aprendidas', String(Repaso.aprendidas(progreso.tarjetas)), 'palabras que ya aguantan varios días'));
    }
    function faltan(xp) {
        const lecciones = Math.ceil(xp / 18);
        return lecciones === 1 ? 'Te falta una lección' : 'Te faltan unas ' + lecciones + ' lecciones';
    }
    function pintarIndicadores() {
        const caja = $('indicadores');
        const racha = crear('span', 'chip', '🔥 ' + rachaViva());
        racha.title = 'Días seguidos practicando';
        const xp = crear('span', 'chip', '⭐ ' + progreso.xp);
        xp.title = 'Experiencia total';
        caja.replaceChildren(racha, xp);
        // sin voz en frances no tiene caso el boton
        if (Voz.puedeHablar()) {
            const b = crear('button', 'interruptor', progreso.voz ? '🔊' : '🔇');
            b.type = 'button';
            b.setAttribute('aria-pressed', String(progreso.voz));
            b.setAttribute('aria-label', 'Pronunciar las palabras solas');
            b.title = progreso.voz ? 'Las palabras se pronuncian solas' : 'Pronunciación automática apagada';
            b.addEventListener('click', () => {
                progreso.voz = !progreso.voz;
                if (!progreso.voz)
                    Voz.callar();
                guardar();
                pintarIndicadores();
            });
            caja.appendChild(b);
        }
    }
    Voz.alCambiar(pintarIndicadores);
    // tarjeta de repaso arriba del camino, solo si hay algo pendiente
    function pintarRepaso() {
        const caja = $('repaso');
        const toca = Repaso.pendientes(progreso.tarjetas).length;
        caja.hidden = toca === 0;
        if (!toca)
            return caja.replaceChildren();
        const texto = crear('div', 'repaso-texto');
        texto.append(crear('b', '', toca === 1 ? 'Tienes 1 palabra para repasar' : 'Tienes ' + toca + ' palabras para repasar'), crear('span', '', 'Repasar justo cuando se te está olvidando es lo que hace que se quede.'));
        const b = crear('button', 'boton', 'Repasar');
        b.type = 'button';
        b.addEventListener('click', empezarRepaso);
        caja.replaceChildren(texto, b);
    }
    const unidadDe = (fr) => UNIDADES.find(u => u.palabras.some(p => p.fr === fr));
    // todas las palabras, agrupadas por unidad
    const buscar = $('buscar');
    let filtro = 'todas';
    const ETIQUETA = {
        todas: 'Todas',
        repasar: 'Por repasar',
        aprendiendo: 'Aprendiendo',
        aprendida: 'Aprendidas',
        nueva: 'Nuevas'
    };
    const estadoDe = (p) => Repaso.estado(progreso.tarjetas[p.fr]);
    function irPalabras() {
        buscar.value = '';
        filtro = 'todas';
        pintarPalabras();
        mostrar('palabras');
    }
    function pintarFiltros() {
        const cuenta = { todas: 0, repasar: 0, aprendiendo: 0, aprendida: 0, nueva: 0 };
        for (const u of UNIDADES)
            for (const p of u.palabras) {
                cuenta.todas++;
                cuenta[estadoDe(p)]++;
            }
        $('filtros').replaceChildren(...Object.keys(ETIQUETA).map(f => {
            const b = crear('button', 'filtro', ETIQUETA[f] + ' · ' + cuenta[f]);
            b.type = 'button';
            b.setAttribute('aria-pressed', String(f === filtro));
            b.disabled = cuenta[f] === 0 && f !== filtro;
            b.addEventListener('click', () => {
                filtro = f;
                pintarPalabras();
            });
            return b;
        }));
    }
    function pintarPalabras() {
        pintarFiltros();
        const texto = sinAcentos(limpiar(buscar.value));
        const coincide = (p) => (filtro === 'todas' || estadoDe(p) === filtro)
            && (!texto || sinAcentos(limpiar(p.fr + ' ' + p.es)).includes(texto));
        let total = 0;
        const grupos = UNIDADES.map(u => {
            const lista = u.palabras.filter(coincide);
            if (!lista.length)
                return null;
            total += lista.length;
            const grupo = crear('section', 'grupo-palabras');
            grupo.style.setProperty('--c', u.color);
            grupo.appendChild(crear('h3', '', u.titulo));
            const ul = crear('ul', 'palabras');
            for (const p of lista)
                ul.appendChild(filaPalabra(p));
            grupo.appendChild(ul);
            return grupo;
        }).filter((g) => g !== null);
        const lista = $('lista-palabras');
        if (grupos.length)
            lista.replaceChildren(...grupos);
        else
            lista.replaceChildren(crear('p', 'vacio', 'No hay palabras con «' + buscar.value.trim() + '».'));
        const todas = UNIDADES.reduce((n, u) => n + u.palabras.length, 0);
        $('palabras-resumen').textContent = texto || filtro !== 'todas'
            ? total + (total === 1 ? ' palabra' : ' palabras') + ' de ' + todas
            : todas + ' palabras y frases en ' + UNIDADES.length + ' unidades, ' + Repaso.aprendidas(progreso.tarjetas) + ' ya aprendidas.';
    }
    function filaPalabra(p) {
        const li = crear('li', 'fila-palabra');
        const textos = crear('div', 'fila-textos');
        const fr = crear('b', '', p.fr);
        fr.lang = 'fr';
        textos.append(fr, crear('span', '', p.es));
        if (p.pista)
            textos.appendChild(crear('small', '', 'suena como ' + p.pista));
        li.appendChild(textos);
        const estado = estadoDe(p);
        if (estado !== 'nueva') {
            const t = progreso.tarjetas[p.fr];
            const insignia = crear('span', 'insignia ' + estado, estado === 'repasar' ? 'Toca repasar' : estado === 'aprendida' ? 'Aprendida' : 'Aprendiendo');
            insignia.title = 'Caja ' + t.caja + ' de 5';
            li.appendChild(insignia);
        }
        if (Voz.puedeHablar())
            li.appendChild(botonAltavoz(p.fr));
        return li;
    }
    // se espera tantito para no repintar en cada letra
    let esperaBuscar = 0;
    buscar.addEventListener('input', () => {
        clearTimeout(esperaBuscar);
        esperaBuscar = window.setTimeout(pintarPalabras, 120);
    });
    // ajustes
    const ajVoz = $('aj-voz');
    const ajLenta = $('aj-lenta');
    function irAjustes() {
        notaProgreso.textContent = '';
        pintarAjustes();
        mostrar('ajustes');
    }
    function pintarAjustes() {
        $('metas').replaceChildren(...METAS.map(m => {
            const b = crear('button', 'meta-opcion');
            b.type = 'button';
            b.setAttribute('aria-pressed', String(meta() === m.xp));
            b.append(crear('b', '', m.nombre), crear('span', '', m.xp + ' XP'), crear('small', '', m.detalle));
            b.addEventListener('click', () => {
                progreso.meta = m.xp;
                guardar();
                pintarAjustes();
            });
            return b;
        }));
        ajVoz.checked = progreso.voz;
        ajLenta.checked = progreso.vozLenta;
        const hay = Voz.puedeHablar();
        ajVoz.disabled = ajLenta.disabled = !hay;
        $('probar-voz').disabled = !hay;
        $('nota-voz').textContent = hay ? '' : 'Este navegador no trae voz en francés. Prueba con Chrome, Edge o Safari.';
    }
    ajVoz.addEventListener('change', () => {
        progreso.voz = ajVoz.checked;
        guardar();
        pintarIndicadores();
    });
    ajLenta.addEventListener('change', () => {
        progreso.vozLenta = ajLenta.checked;
        Voz.velocidad(progreso.vozLenta);
        guardar();
    });
    $('probar-voz').addEventListener('click', () => Voz.decir('Bonjour, comment ça va ?'));
    // respaldo en un archivo, asi el progreso no se queda atrapado en un solo navegador
    const notaProgreso = $('nota-progreso');
    $('descargar').addEventListener('click', () => {
        const archivo = { app: 'allez', version: 1, fecha: new Date().toISOString(), progreso };
        const url = URL.createObjectURL(new Blob([JSON.stringify(archivo, null, 2)], { type: 'application/json' }));
        const a = crear('a');
        a.href = url;
        a.download = 'allez-progreso-' + Repaso.dia() + '.json';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        notaProgreso.textContent = 'Listo, revisa tus descargas.';
    });
    // se cambia el contenido y no el objeto, asi todo lo que ya lo usa ve lo nuevo
    function reemplazarProgreso(nuevo) {
        for (const k of Object.keys(progreso))
            delete progreso[k];
        Object.assign(progreso, nuevo);
        Voz.velocidad(progreso.vozLenta);
        guardar();
    }
    // solo se aceptan las partes que conoce la app y con el tipo correcto
    function validar(datos) {
        if (!datos || typeof datos !== 'object')
            return null;
        const crudo = datos.progreso ?? datos;
        if (!crudo || typeof crudo !== 'object')
            return null;
        const p = crudo;
        const esObjeto = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
        if (!esObjeto(p.unidades) || !esObjeto(p.tarjetas))
            return null;
        const base = nuevoProgreso();
        const r = base;
        for (const k of Object.keys(base)) {
            if (k in p && typeof p[k] === typeof r[k])
                r[k] = p[k];
        }
        return base;
    }
    $('cargar').addEventListener('change', async (ev) => {
        const input = ev.target;
        const archivo = input.files?.[0];
        input.value = '';
        if (!archivo)
            return;
        try {
            const nuevo = validar(JSON.parse(await archivo.text()));
            if (!nuevo)
                throw new Error('formato');
            reemplazarProgreso(nuevo);
            pintarAjustes();
            pintarIndicadores();
            const n = Object.keys(nuevo.unidades).length;
            notaProgreso.textContent = 'Se cargó tu progreso, ' + nuevo.xp + ' XP y ' + n + (n === 1 ? ' unidad practicada.' : ' unidades practicadas.');
        }
        catch (e) {
            notaProgreso.textContent = 'Ese archivo no es un respaldo de Allez!, no se cambió nada.';
        }
    });
    // sin ventanas de confirmar, el primer toque pregunta y el segundo borra
    let borrarListo = 0;
    const botonBorrar = $('borrar');
    botonBorrar.addEventListener('click', () => {
        if (Date.now() > borrarListo) {
            borrarListo = Date.now() + 4000;
            botonBorrar.textContent = '¿Seguro? Toca otra vez para borrar todo';
            botonBorrar.classList.add('seguro');
            setTimeout(() => {
                botonBorrar.textContent = 'Borrar todo mi progreso';
                botonBorrar.classList.remove('seguro');
            }, 4000);
            return;
        }
        borrarListo = 0;
        reemplazarProgreso(nuevoProgreso());
        pintarAjustes();
        pintarIndicadores();
        botonBorrar.textContent = 'Borrar todo mi progreso';
        botonBorrar.classList.remove('seguro');
        notaProgreso.textContent = 'Listo, empiezas de cero.';
    });
    Voz.alCambiar(() => { if (document.body.dataset.pantalla === 'ajustes')
        pintarAjustes(); });
    // armado de ejercicios
    const LARGO = 10;
    const MAX_ESCRIBIR = 22;
    // las opciones salen de la misma unidad, si no alcanzan se completan con otras
    function distractores(correcta, unidad, campo) {
        const vistos = new Set([correcta[campo]]);
        const salida = [];
        const fuentes = [revolver(unidad.palabras), revolver(UNIDADES.flatMap(u => u.palabras))];
        for (const fuente of fuentes) {
            for (const p of fuente) {
                if (salida.length === 3)
                    return salida;
                if (vistos.has(p[campo]))
                    continue;
                vistos.add(p[campo]);
                salida.push(p[campo]);
            }
        }
        return salida;
    }
    function ejercicio(tipo, palabra, unidad) {
        if (tipo === 'escribir' && palabra.fr.length > MAX_ESCRIBIR)
            tipo = 'inverso';
        if (tipo === 'escuchar' && !Voz.puedeHablar())
            tipo = 'inverso';
        if (tipo === 'hablar' && !puedeHablarAhora())
            tipo = 'inverso';
        const campo = tipo === 'elegir' ? 'es' : 'fr';
        const opciones = tipo === 'escribir' || tipo === 'hablar' ? [] : revolver([palabra[campo], ...distractores(palabra, unidad, campo)]);
        return { tipo, palabra, opciones };
    }
    // si dices que ahora no puedes hablar se dejan de pedir un rato
    let sinMicrofonoHasta = 0;
    const puedeHablarAhora = () => Voz.puedeOir() && Date.now() > sinMicrofonoHasta;
    function tiposDeRepaso() {
        const tipos = ['inverso', 'escribir'];
        if (Voz.puedeHablar())
            tipos.push('escuchar');
        if (puedeHablarAhora())
            tipos.push('hablar');
        return tipos;
    }
    // hablar cansa, con dos por leccion basta
    function limitarHablar(lista) {
        let cuantos = 0;
        return lista.map(e => e.tipo === 'hablar' && ++cuantos > 2 ? cambiarA('inverso', e) : e);
    }
    function cambiarA(tipo, e) {
        const u = unidadDe(e.palabra.fr);
        return u ? ejercicio(tipo, e.palabra, u) : e;
    }
    // las fichas son las palabras de la frase sin signos, mas unas de otras frases para despistar
    const fichasDe = (t) => t.replace(/[?!.,¿¡]/g, ' ').split(/\s+/).filter(Boolean);
    function ejercicioFrase(f, unidad) {
        const propias = fichasDe(f.fr);
        const usadas = new Set(propias.map(x => x.toLowerCase()));
        const otras = [];
        for (const x of revolver((unidad.frases ?? []).flatMap(o => fichasDe(o.fr)))) {
            if (otras.length === 3)
                break;
            if (usadas.has(x.toLowerCase()))
                continue;
            usadas.add(x.toLowerCase());
            otras.push(x);
        }
        return { tipo: 'armar', palabra: { fr: f.fr, es: f.es }, opciones: revolver([...propias, ...otras]) };
    }
    // las frases van al final, cuando ya viste las palabras sueltas
    function conFrases(lista, unidad, cuantas) {
        const frases = revolver(unidad.frases ?? []).slice(0, cuantas).map(f => ejercicioFrase(f, unidad));
        return [...lista.slice(0, lista.length - frases.length), ...frases];
    }
    // la primera vez cada palabra se presenta para reconocerla y luego se pide al reves
    function armarLeccion(unidad) {
        return conFrases(armarPalabras(unidad), unidad, progreso.unidades[unidad.id] ? 2 : 1);
    }
    function armarPalabras(unidad) {
        const nueva = !progreso.unidades[unidad.id];
        const palabras = revolver(unidad.palabras).slice(0, nueva ? 7 : LARGO);
        if (nueva) {
            const presentar = palabras.map(p => ejercicio('elegir', p, unidad));
            const repasar = revolver(palabras).slice(0, LARGO - presentar.length)
                .map(p => ejercicio(azar(tiposDeRepaso()), p, unidad));
            return limitarHablar([...presentar.slice(0, 4), ...repasar.slice(0, 1), ...presentar.slice(4), ...repasar.slice(1)]);
        }
        return limitarHablar(palabras.map(p => ejercicio(azar(['elegir', ...tiposDeRepaso()]), p, unidad)));
    }
    let sesion = null;
    let actual = null;
    let respuesta = '';
    let revisado = false;
    const caja = $('ejercicio');
    const boton = $('comprobar');
    const pie = $('pie');
    const veredicto = $('veredicto');
    function empezar(unidad) {
        arrancar(unidad, armarLeccion(unidad));
    }
    function empezarRepaso() {
        const cola = [];
        for (const fr of Repaso.pendientes(progreso.tarjetas).slice(0, LARGO)) {
            const u = unidadDe(fr);
            const p = u?.palabras.find(x => x.fr === fr);
            if (u && p)
                cola.push(ejercicio(azar(['elegir', ...tiposDeRepaso()]), p, u));
        }
        if (cola.length)
            arrancar(null, limitarHablar(cola));
    }
    function arrancar(unidad, cola) {
        sesion = { unidad, cola, total: cola.length, hechos: 0, aciertos: 0, intentos: 0, repetidos: new Set() };
        mostrar('leccion');
        siguiente();
    }
    function pintarAvance() {
        if (!sesion)
            return;
        const pct = Math.round(100 * sesion.hechos / sesion.total);
        const barra = $('avance');
        barra.setAttribute('aria-valuenow', String(pct));
        barra.firstElementChild.style.width = pct + '%';
    }
    function siguiente() {
        if (!sesion)
            return;
        pintarAvance();
        const e = sesion.cola.shift();
        if (!e)
            return terminar();
        actual = e;
        respuesta = '';
        revisado = false;
        pie.classList.remove('bien', 'mal');
        veredicto.replaceChildren();
        boton.textContent = 'Comprobar';
        boton.disabled = true;
        pintarEjercicio(e);
    }
    const CONSIGNA = {
        elegir: '¿Qué significa?',
        inverso: '¿Cómo se dice en francés?',
        escribir: 'Escríbelo en francés',
        escuchar: '¿Qué escuchaste?',
        hablar: 'Dilo en voz alta',
        armar: 'Arma la frase en francés'
    };
    function botonAltavoz(texto, lento = false) {
        const b = crear('button', 'altavoz' + (lento ? ' lento' : ''), lento ? '🐢' : '🔊');
        b.type = 'button';
        b.setAttribute('aria-label', lento ? 'Escuchar despacio' : 'Escuchar');
        b.addEventListener('click', () => Voz.decir(texto, lento));
        return b;
    }
    function pintarEjercicio(e) {
        const partes = [crear('p', 'consigna', CONSIGNA[e.tipo])];
        const enFrances = e.tipo === 'elegir' || e.tipo === 'hablar';
        if (e.tipo === 'escuchar') {
            // aqui la palabra no se ve, solo se oye
            const oir = crear('div', 'oir');
            const grande = botonAltavoz(e.palabra.fr);
            grande.classList.add('grande');
            oir.append(grande, botonAltavoz(e.palabra.fr, true));
            partes.push(oir);
            setTimeout(() => Voz.decir(e.palabra.fr), 250);
        }
        else {
            const palabra = crear('div', 'palabra');
            palabra.lang = enFrances ? 'fr' : 'es';
            palabra.appendChild(crear('span', '', enFrances ? e.palabra.fr : e.palabra.es));
            if (enFrances && Voz.puedeHablar()) {
                palabra.appendChild(botonAltavoz(e.palabra.fr));
                if (progreso.voz && e.tipo === 'elegir')
                    setTimeout(() => Voz.decir(e.palabra.fr), 250);
            }
            partes.push(palabra);
            partes.push(crear('p', 'pista', enFrances && e.palabra.pista ? 'Suena como ' + e.palabra.pista : ''));
        }
        if (e.tipo === 'escribir')
            partes.push(...campoEscribir());
        else if (e.tipo === 'hablar')
            partes.push(...campoHablar());
        else if (e.tipo === 'armar')
            partes.push(...campoArmar(e));
        else
            partes.push(pintarOpciones(e));
        caja.replaceChildren(...partes);
        const primero = caja.querySelector('textarea, .opcion, .ficha');
        if (primero && matchMedia('(pointer: fine)').matches)
            primero.focus();
    }
    function pintarOpciones(e) {
        const lista = crear('div', 'opciones');
        lista.setAttribute('role', 'group');
        e.opciones.forEach((texto, i) => {
            const b = crear('button', 'opcion');
            b.type = 'button';
            b.dataset.valor = texto;
            if (e.tipo !== 'elegir')
                b.lang = 'fr';
            b.appendChild(crear('kbd', '', String(i + 1)));
            b.appendChild(crear('span', '', texto));
            b.addEventListener('click', () => elegir(texto));
            lista.appendChild(b);
        });
        return lista;
    }
    function elegir(texto) {
        if (revisado)
            return;
        respuesta = texto;
        caja.querySelectorAll('.opcion').forEach(o => o.classList.toggle('elegida', o.dataset.valor === texto));
        boton.disabled = false;
    }
    function campoEscribir() {
        const area = crear('textarea', 'escribe');
        area.lang = 'fr';
        area.rows = 3;
        area.placeholder = 'Escribe en francés';
        area.setAttribute('aria-label', 'Tu respuesta en francés');
        area.autocapitalize = 'off';
        area.spellcheck = false;
        area.addEventListener('input', () => {
            respuesta = area.value;
            boton.disabled = !area.value.trim();
        });
        // en muchos teclados no salen estas letras, asi se ponen con un toque
        const acentos = crear('div', 'acentos');
        for (const letra of ['é', 'è', 'ê', 'à', 'ç', 'ô', 'û', 'î', 'ï', 'œ', "'"]) {
            const b = crear('button', '', letra);
            b.type = 'button';
            b.setAttribute('aria-label', 'Escribir ' + letra);
            b.addEventListener('click', () => {
                const ini = area.selectionStart, fin = area.selectionEnd;
                area.setRangeText(letra, ini, fin, 'end');
                area.dispatchEvent(new Event('input'));
                area.focus();
            });
            acentos.appendChild(b);
        }
        return [area, acentos];
    }
    // tocar una ficha la sube a la linea y tocarla otra vez la regresa
    function campoArmar(e) {
        const linea = crear('div', 'linea-armar');
        linea.setAttribute('aria-label', 'Tu frase');
        const banco = crear('div', 'banco');
        banco.setAttribute('aria-label', 'Fichas');
        const puestas = [];
        const actualizar = () => {
            respuesta = puestas.map(f => f.dataset.valor).join(' ');
            boton.disabled = puestas.length === 0;
            linea.classList.toggle('vacia', puestas.length === 0);
        };
        e.opciones.forEach(texto => {
            const hueco = crear('span', 'hueco');
            const ficha = crear('button', 'ficha', texto);
            ficha.type = 'button';
            ficha.lang = 'fr';
            ficha.dataset.valor = texto;
            ficha.addEventListener('click', () => {
                if (revisado)
                    return;
                if (ficha.parentElement === linea) {
                    puestas.splice(puestas.indexOf(ficha), 1);
                    hueco.appendChild(ficha);
                }
                else {
                    puestas.push(ficha);
                    linea.appendChild(ficha);
                    if (progreso.voz)
                        Voz.decir(texto);
                }
                actualizar();
            });
            hueco.appendChild(ficha);
            banco.appendChild(hueco);
        });
        actualizar();
        return [linea, banco];
    }
    function campoHablar() {
        const mic = crear('button', 'microfono');
        mic.type = 'button';
        mic.setAttribute('aria-label', 'Hablar');
        mic.appendChild(crear('span', 'microfono-icono', '🎙️'));
        mic.appendChild(crear('span', '', 'Toca y habla'));
        const estado = crear('p', 'estado-mic');
        estado.setAttribute('aria-live', 'polite');
        mic.addEventListener('click', () => {
            if (revisado || mic.classList.contains('oyendo'))
                return;
            mic.classList.add('oyendo');
            estado.textContent = 'Te escucho…';
            Voz.oir().then(dicho => {
                mic.classList.remove('oyendo');
                estado.textContent = '';
                oido = dicho;
                respuesta = dicho[0];
                revisar();
            }).catch((err) => {
                mic.classList.remove('oyendo');
                if (err.message === 'not-allowed' || err.message === 'service-not-allowed') {
                    estado.textContent = 'No hay permiso para el micrófono. Puedes saltarte este ejercicio.';
                }
                else if (err.message === 'no-speech') {
                    estado.textContent = 'No te escuché, toca otra vez y habla un poco más fuerte.';
                }
                else {
                    estado.textContent = 'El micrófono no respondió, intenta otra vez.';
                }
            });
        });
        const saltar = crear('button', 'saltar', 'Ahora no puedo hablar');
        saltar.type = 'button';
        saltar.addEventListener('click', () => {
            Voz.dejarDeOir();
            sinMicrofonoHasta = Date.now() + 15 * 60 * 1000;
            saltarActual();
        });
        return [mic, estado, saltar];
    }
    // se cuenta como hecho pero no como intento, no es justo que baje el porcentaje
    function saltarActual() {
        if (!sesion || !actual)
            return;
        sesion.hechos++;
        sesion.cola = sesion.cola.map(e => e.tipo === 'hablar' ? cambiarA('inverso', e) : e);
        siguiente();
    }
    let oido = [];
    // revision de respuestas
    const sinAcentos = (t) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    function limpiar(t) {
        return t.toLowerCase()
            .replace(/[’`´]/g, "'")
            .replace(/[¿?¡!.,;:…]/g, ' ')
            .replace(/\s*-\s*/g, '-')
            .replace(/\s+/g, ' ')
            .trim();
    }
    function distancia(a, b) {
        const fila = Array.from({ length: b.length + 1 }, (_, j) => j);
        for (let i = 1; i <= a.length; i++) {
            let previo = fila[0];
            fila[0] = i;
            for (let j = 1; j <= b.length; j++) {
                const guardado = fila[j];
                fila[j] = Math.min(fila[j] + 1, fila[j - 1] + 1, previo + (a[i - 1] === b[j - 1] ? 0 : 1));
                previo = guardado;
            }
        }
        return fila[b.length];
    }
    // de lo que entendio el navegador se queda con lo que mas se parece
    function revisarHablado(dicho, correcto) {
        const b = sinAcentos(limpiar(correcto));
        let mejor = 0, frase = dicho[0] ?? '';
        for (const d of dicho) {
            const a = sinAcentos(limpiar(d));
            const parecido = 1 - distancia(a, b) / Math.max(a.length, b.length, 1);
            if (parecido > mejor) {
                mejor = parecido;
                frase = d;
            }
        }
        const nota = 'Escuché «' + frase + '»';
        return { bien: mejor >= .75, nota };
    }
    function revisarEscrito(escrito, correcto) {
        const a = limpiar(escrito), b = limpiar(correcto);
        if (a === b)
            return { bien: true };
        if (sinAcentos(a) === sinAcentos(b))
            return { bien: true, nota: 'Ojo con los acentos, se escribe ' + correcto };
        if (b.length > 4 && distancia(sinAcentos(a), sinAcentos(b)) === 1)
            return { bien: true, nota: 'Casi exacto, se escribe ' + correcto };
        return { bien: false };
    }
    function revisar() {
        if (!sesion || !actual)
            return;
        const e = actual;
        const correcto = e.tipo === 'elegir' ? e.palabra.es : e.palabra.fr;
        Voz.callar();
        const r = e.tipo === 'armar' ? { bien: limpiar(respuesta) === limpiar(correcto) }
            : e.tipo === 'escribir' ? revisarEscrito(respuesta, correcto)
                : e.tipo === 'hablar' ? revisarHablado(oido, correcto)
                    : { bien: respuesta === correcto };
        revisado = true;
        sesion.intentos++;
        caja.querySelectorAll('.opcion').forEach(o => {
            o.disabled = true;
            if (o.dataset.valor === correcto)
                o.classList.add('bien');
            else if (o.dataset.valor === respuesta)
                o.classList.add('mal');
        });
        const area = caja.querySelector('textarea');
        if (area)
            area.readOnly = true;
        caja.querySelectorAll('.microfono, .saltar, .ficha').forEach(b => b.disabled = true);
        caja.querySelector('.linea-armar')?.classList.add(r.bien ? 'bien' : 'mal');
        // al repaso solo cuenta el primer intento, el repetido ya va con la respuesta vista
        // las frases no entran al repaso, ahi solo van palabras
        if (!sesion.repetidos.has(e) && e.tipo !== 'armar')
            Repaso.registrar(progreso.tarjetas, e.palabra.fr, r.bien);
        if (r.bien) {
            sesion.aciertos++;
            sesion.hechos++;
        }
        else if (!sesion.repetidos.has(e)) {
            // lo que fallas regresa al final de la leccion, una sola vez
            sesion.repetidos.add(e);
            sesion.cola.push(e);
            sesion.total++;
            sesion.hechos++;
        }
        else {
            sesion.hechos++;
        }
        pie.classList.add(r.bien ? 'bien' : 'mal');
        const titulo = crear('b', '', r.bien ? azar(['¡Muy bien!', '¡Exacto!', 'Parfait !', '¡Eso!']) : e.tipo === 'hablar' ? 'Casi, otra vez al final' : 'Respuesta correcta');
        const detalle = crear('span', '', r.bien ? r.nota ?? '' : e.tipo === 'hablar' ? (r.nota ?? '') + ', se dice ' + correcto : correcto);
        if (!r.bien && e.tipo !== 'elegir')
            detalle.lang = 'fr';
        veredicto.replaceChildren(titulo, detalle);
        boton.textContent = 'Continuar';
        boton.disabled = false;
        boton.focus();
        // al acertar se oye como se dice, asi se queda pegado el sonido con la palabra
        if (r.bien && progreso.voz && e.tipo !== 'elegir' && e.tipo !== 'escuchar')
            Voz.decir(e.palabra.fr);
    }
    boton.addEventListener('click', () => revisado ? siguiente() : revisar());
    function terminar() {
        if (!sesion)
            return;
        const s = sesion;
        const pct = s.intentos ? s.aciertos / s.intentos : 0;
        // diez por terminar, uno por acierto y cinco extra si no fallaste nada
        const ganado = 10 + s.aciertos + (pct === 1 ? 5 : 0);
        const nivelAntes = nivel();
        const nuevoDia = sumarDia(ganado);
        if (s.unidad) {
            const antes = progreso.unidades[s.unidad.id];
            progreso.unidades[s.unidad.id] = { veces: (antes?.veces ?? 0) + 1, mejor: Math.max(antes?.mejor ?? 0, pct) };
        }
        guardar();
        $('fin-frase').textContent = pct === 1 ? 'Sin un solo error, impecable.' : pct >= .8 ? 'Muy bien, ya casi la dominas.' : 'Vas bien, repítela para afianzar.';
        const dato = (n, t) => {
            const d = crear('div', 'dato');
            d.append(crear('b', '', n), crear('span', '', t));
            return d;
        };
        $('resumen').replaceChildren(dato('+' + ganado, 'XP ganada'), dato(Math.round(pct * 100) + '%', 'de aciertos'), dato('🔥 ' + progreso.racha, progreso.racha === 1 ? 'día de racha' : 'días de racha'));
        const extra = [];
        if (nuevoDia && progreso.racha > 1)
            extra.push('Tu racha sube a ' + progreso.racha + ' días.');
        if (nivel() > nivelAntes)
            extra.push('¡Subiste al nivel ' + nivel() + '!');
        if (xpDeHoy() >= meta() && xpDeHoy() - ganado < meta())
            extra.push('Cumpliste la meta de hoy.');
        if (extra.length)
            $('fin-frase').textContent += ' ' + extra.join(' ');
        const tip = $('tip');
        if (s.unidad)
            tip.replaceChildren(crear('b', '', s.unidad.tip.titulo), crear('span', '', s.unidad.tip.texto));
        else
            tip.replaceChildren();
        $('t-fin').textContent = s.unidad ? '¡Lección terminada!' : '¡Repaso terminado!';
        sesion = null;
        actual = null;
        pintarIndicadores();
        mostrar('fin');
    }
    $('salir').addEventListener('click', () => {
        Voz.callar();
        irInicio();
    });
    // teclado, numeros para elegir y enter para seguir
    document.addEventListener('keydown', ev => {
        if (document.body.dataset.pantalla !== 'leccion' || !actual)
            return;
        const enTexto = ev.target instanceof HTMLTextAreaElement;
        if (ev.key === 'Enter' && !ev.shiftKey) {
            // en el cuadro de texto el enter nunca hace salto de linea
            if (enTexto)
                ev.preventDefault();
            if (!boton.disabled) {
                ev.preventDefault();
                boton.click();
            }
            return;
        }
        if (ev.key === 'Escape') {
            Voz.callar();
            return irInicio();
        }
        if (enTexto || revisado || actual.tipo === 'armar')
            return;
        const n = Number(ev.key);
        if (n >= 1 && n <= actual.opciones.length)
            elegir(actual.opciones[n - 1]);
    });
    irInicio();
    // solo funciona con https o en localhost, en github pages ya hay https
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
        addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => { }));
    }
})();
