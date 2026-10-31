// la app completa, pantallas, lecciones y progreso guardado en el navegador
(() => {
    function $<T extends HTMLElement = HTMLElement>(id: string): T {
        const el = document.getElementById(id);
        if (!el) throw new Error('falta #' + id + ' en el html');
        return el as T;
    }

    function crear<K extends keyof HTMLElementTagNameMap>(tag: K, clase = '', texto?: string): HTMLElementTagNameMap[K] {
        const el = document.createElement(tag);
        if (clase) el.className = clase;
        if (texto !== undefined) el.textContent = texto;
        return el;
    }

    const azar = <T>(lista: T[]): T => lista[Math.floor(Math.random() * lista.length)];

    function revolver<T>(lista: T[]): T[] {
        const r = lista.slice();
        for (let i = r.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [r[i], r[j]] = [r[j], r[i]];
        }
        return r;
    }

    // progreso guardado

    const CLAVE = 'allez';

    function leerProgreso(): Progreso {
        const base: Progreso = { unidades: {}, tarjetas: {}, voz: true, xp: 0, racha: 0, ultimoDia: '', xpHoy: { dia: '', xp: 0 } };
        try {
            const guardado = JSON.parse(localStorage.getItem(CLAVE) || '{}');
            return Object.assign(base, guardado);
        } catch (e) {
            return base;
        }
    }

    const progreso = leerProgreso();

    function guardar() {
        try { localStorage.setItem(CLAVE, JSON.stringify(progreso)); } catch (e) {}
    }

    // experiencia, niveles y racha

    const META_DIARIA = 30;
    const XP_POR_NIVEL = 100;

    const nivel = () => Math.floor(progreso.xp / XP_POR_NIVEL) + 1;
    const xpDeHoy = () => progreso.xpHoy.dia === Repaso.dia() ? progreso.xpHoy.xp : 0;

    // si ayer no practicaste la racha ya se perdio aunque el numero siga guardado
    const rachaViva = () => progreso.ultimoDia === Repaso.dia() || progreso.ultimoDia === Repaso.dia(-1) ? progreso.racha : 0;

    // devuelve true si hoy es el primer dia que suma a la racha
    function sumarDia(xp: number): boolean {
        const hoy = Repaso.dia();
        progreso.xp += xp;
        progreso.xpHoy = { dia: hoy, xp: xpDeHoy() + xp };
        if (progreso.ultimoDia === hoy) return false;
        progreso.racha = progreso.ultimoDia === Repaso.dia(-1) ? progreso.racha + 1 : 1;
        progreso.ultimoDia = hoy;
        return true;
    }

    // pantallas

    type Pantalla = 'inicio' | 'leccion' | 'fin';

    function mostrar(p: Pantalla) {
        document.querySelectorAll<HTMLElement>('.pantalla').forEach(s => s.classList.toggle('activa', s.id === 'p-' + p));
        document.body.dataset.pantalla = p;
        window.scrollTo(0, 0);
    }

    document.querySelectorAll<HTMLElement>('[data-ir]').forEach(b => b.addEventListener('click', () => {
        if (b.dataset.ir === 'inicio') irInicio();
    }));

    // inicio

    const desbloqueada = (i: number) => i === 0 || (progreso.unidades[UNIDADES[i - 1].id]?.veces ?? 0) > 0;

    function estrellas(mejor: number | undefined): HTMLElement {
        const cuantas = mejor === undefined ? 0 : mejor >= 1 ? 3 : mejor >= .8 ? 2 : 1;
        const caja = crear('span', 'estrellas');
        caja.setAttribute('aria-label', cuantas + ' de 3 estrellas');
        for (let k = 0; k < 3; k++) caja.appendChild(crear('span', k < cuantas ? '' : 'apagada', '★'));
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

    function barra(pct: number, clase = ''): HTMLElement {
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

        const tarjeta = (titulo: string, valor: string, detalle: string, avance?: HTMLElement) => {
            const t = crear('div', 'marcador');
            t.append(crear('span', 'marcador-titulo', titulo), crear('b', '', valor));
            if (avance) t.appendChild(avance);
            t.appendChild(crear('span', 'marcador-detalle', detalle));
            return t;
        };

        $('tablero').replaceChildren(
            tarjeta('Racha', '🔥 ' + racha + (racha === 1 ? ' día' : ' días'),
                racha && progreso.ultimoDia !== Repaso.dia() ? 'Practica hoy para no perderla' : racha ? 'Hoy ya cuenta' : 'Haz una lección para empezarla'),
            tarjeta('Meta de hoy', Math.min(hoy, META_DIARIA) + ' / ' + META_DIARIA + ' XP',
                hoy >= META_DIARIA ? '¡Cumplida, très bien!' : 'Más o menos dos lecciones', barra(hoy / META_DIARIA, 'meta')),
            tarjeta('Nivel ' + nivel(), progreso.xp + ' XP',
                (XP_POR_NIVEL - enNivel) + ' XP para el nivel ' + (nivel() + 1), barra(enNivel / XP_POR_NIVEL)),
            tarjeta('Aprendidas', String(Repaso.aprendidas(progreso.tarjetas)),
                'palabras que ya aguantan varios días')
        );
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
                if (!progreso.voz) Voz.callar();
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
        if (!toca) return caja.replaceChildren();

        const texto = crear('div', 'repaso-texto');
        texto.append(
            crear('b', '', toca === 1 ? 'Tienes 1 palabra para repasar' : 'Tienes ' + toca + ' palabras para repasar'),
            crear('span', '', 'Repasar justo cuando se te está olvidando es lo que hace que se quede.')
        );
        const b = crear('button', 'boton', 'Repasar');
        b.type = 'button';
        b.addEventListener('click', empezarRepaso);
        caja.replaceChildren(texto, b);
    }

    const unidadDe = (fr: string) => UNIDADES.find(u => u.palabras.some(p => p.fr === fr));

    // armado de ejercicios

    const LARGO = 10;
    const MAX_ESCRIBIR = 22;

    // las opciones salen de la misma unidad, si no alcanzan se completan con otras
    function distractores(correcta: Palabra, unidad: Unidad, campo: 'fr' | 'es'): string[] {
        const vistos = new Set([correcta[campo]]);
        const salida: string[] = [];
        const fuentes = [revolver(unidad.palabras), revolver(UNIDADES.flatMap(u => u.palabras))];
        for (const fuente of fuentes) {
            for (const p of fuente) {
                if (salida.length === 3) return salida;
                if (vistos.has(p[campo])) continue;
                vistos.add(p[campo]);
                salida.push(p[campo]);
            }
        }
        return salida;
    }

    function ejercicio(tipo: TipoEjercicio, palabra: Palabra, unidad: Unidad): Ejercicio {
        if (tipo === 'escribir' && palabra.fr.length > MAX_ESCRIBIR) tipo = 'inverso';
        if (tipo === 'escuchar' && !Voz.puedeHablar()) tipo = 'inverso';
        if (tipo === 'hablar' && !puedeHablarAhora()) tipo = 'inverso';
        const campo = tipo === 'elegir' ? 'es' : 'fr';
        const opciones = tipo === 'escribir' || tipo === 'hablar' ? [] : revolver([palabra[campo], ...distractores(palabra, unidad, campo)]);
        return { tipo, palabra, opciones };
    }

    // la primera vez cada palabra se presenta para reconocerla y luego se pide al reves
    // si dices que ahora no puedes hablar se dejan de pedir un rato
    let sinMicrofonoHasta = 0;
    const puedeHablarAhora = () => Voz.puedeOir() && Date.now() > sinMicrofonoHasta;

    function tiposDeRepaso(): TipoEjercicio[] {
        const tipos: TipoEjercicio[] = ['inverso', 'escribir'];
        if (Voz.puedeHablar()) tipos.push('escuchar');
        if (puedeHablarAhora()) tipos.push('hablar');
        return tipos;
    }

    // hablar cansa, con dos por leccion basta
    function limitarHablar(lista: Ejercicio[]): Ejercicio[] {
        let cuantos = 0;
        return lista.map(e => e.tipo === 'hablar' && ++cuantos > 2 ? cambiarA('inverso', e) : e);
    }

    function cambiarA(tipo: TipoEjercicio, e: Ejercicio): Ejercicio {
        const u = unidadDe(e.palabra.fr);
        return u ? ejercicio(tipo, e.palabra, u) : e;
    }

    function armarLeccion(unidad: Unidad): Ejercicio[] {
        const nueva = !progreso.unidades[unidad.id];
        const palabras = revolver(unidad.palabras).slice(0, nueva ? 7 : LARGO);
        if (nueva) {
            const presentar = palabras.map(p => ejercicio('elegir', p, unidad));
            const repasar = revolver(palabras).slice(0, LARGO - presentar.length)
                .map(p => ejercicio(azar(tiposDeRepaso()), p, unidad));
            return limitarHablar([...presentar.slice(0, 4), ...repasar.slice(0, 1), ...presentar.slice(4), ...repasar.slice(1)]);
        }
        return limitarHablar(palabras.map(p => ejercicio(azar<TipoEjercicio>(['elegir', ...tiposDeRepaso()]), p, unidad)));
    }

    // leccion

    interface Sesion {
        // en el repaso la leccion mezcla unidades y no hay una sola
        unidad: Unidad | null;
        cola: Ejercicio[];
        total: number;
        hechos: number;
        aciertos: number;
        intentos: number;
        repetidos: Set<Ejercicio>;
    }

    let sesion: Sesion | null = null;
    let actual: Ejercicio | null = null;
    let respuesta = '';
    let revisado = false;

    const caja = $('ejercicio');
    const boton = $<HTMLButtonElement>('comprobar');
    const pie = $('pie');
    const veredicto = $('veredicto');

    function empezar(unidad: Unidad) {
        arrancar(unidad, armarLeccion(unidad));
    }

    function empezarRepaso() {
        const cola: Ejercicio[] = [];
        for (const fr of Repaso.pendientes(progreso.tarjetas).slice(0, LARGO)) {
            const u = unidadDe(fr);
            const p = u?.palabras.find(x => x.fr === fr);
            if (u && p) cola.push(ejercicio(azar<TipoEjercicio>(['elegir', ...tiposDeRepaso()]), p, u));
        }
        if (cola.length) arrancar(null, limitarHablar(cola));
    }

    function arrancar(unidad: Unidad | null, cola: Ejercicio[]) {
        sesion = { unidad, cola, total: cola.length, hechos: 0, aciertos: 0, intentos: 0, repetidos: new Set() };
        mostrar('leccion');
        siguiente();
    }

    function pintarAvance() {
        if (!sesion) return;
        const pct = Math.round(100 * sesion.hechos / sesion.total);
        const barra = $('avance');
        barra.setAttribute('aria-valuenow', String(pct));
        (barra.firstElementChild as HTMLElement).style.width = pct + '%';
    }

    function siguiente() {
        if (!sesion) return;
        pintarAvance();
        const e = sesion.cola.shift();
        if (!e) return terminar();
        actual = e;
        respuesta = '';
        revisado = false;
        pie.classList.remove('bien', 'mal');
        veredicto.replaceChildren();
        boton.textContent = 'Comprobar';
        boton.disabled = true;
        pintarEjercicio(e);
    }

    const CONSIGNA: Record<TipoEjercicio, string> = {
        elegir: '¿Qué significa?',
        inverso: '¿Cómo se dice en francés?',
        escribir: 'Escríbelo en francés',
        escuchar: '¿Qué escuchaste?',
        hablar: 'Dilo en voz alta'
    };

    function botonAltavoz(texto: string, lento = false): HTMLButtonElement {
        const b = crear('button', 'altavoz' + (lento ? ' lento' : ''), lento ? '🐢' : '🔊');
        b.type = 'button';
        b.setAttribute('aria-label', lento ? 'Escuchar despacio' : 'Escuchar');
        b.addEventListener('click', () => Voz.decir(texto, lento));
        return b;
    }

    function pintarEjercicio(e: Ejercicio) {
        const partes: HTMLElement[] = [crear('p', 'consigna', CONSIGNA[e.tipo])];
        const enFrances = e.tipo === 'elegir' || e.tipo === 'hablar';

        if (e.tipo === 'escuchar') {
            // aqui la palabra no se ve, solo se oye
            const oir = crear('div', 'oir');
            const grande = botonAltavoz(e.palabra.fr);
            grande.classList.add('grande');
            oir.append(grande, botonAltavoz(e.palabra.fr, true));
            partes.push(oir);
            setTimeout(() => Voz.decir(e.palabra.fr), 250);
        } else {
            const palabra = crear('div', 'palabra');
            palabra.lang = enFrances ? 'fr' : 'es';
            palabra.appendChild(crear('span', '', enFrances ? e.palabra.fr : e.palabra.es));
            if (enFrances && Voz.puedeHablar()) {
                palabra.appendChild(botonAltavoz(e.palabra.fr));
                if (progreso.voz && e.tipo === 'elegir') setTimeout(() => Voz.decir(e.palabra.fr), 250);
            }
            partes.push(palabra);
            partes.push(crear('p', 'pista', enFrances && e.palabra.pista ? 'Suena como ' + e.palabra.pista : ''));
        }

        if (e.tipo === 'escribir') partes.push(...campoEscribir());
        else if (e.tipo === 'hablar') partes.push(...campoHablar());
        else partes.push(pintarOpciones(e));

        caja.replaceChildren(...partes);
        const primero = caja.querySelector<HTMLElement>('textarea, .opcion');
        if (primero && matchMedia('(pointer: fine)').matches) primero.focus();
    }

    function pintarOpciones(e: Ejercicio): HTMLElement {
        const lista = crear('div', 'opciones');
        lista.setAttribute('role', 'group');
        e.opciones.forEach((texto, i) => {
            const b = crear('button', 'opcion');
            b.type = 'button';
            b.dataset.valor = texto;
            if (e.tipo !== 'elegir') b.lang = 'fr';
            b.appendChild(crear('kbd', '', String(i + 1)));
            b.appendChild(crear('span', '', texto));
            b.addEventListener('click', () => elegir(texto));
            lista.appendChild(b);
        });
        return lista;
    }

    function elegir(texto: string) {
        if (revisado) return;
        respuesta = texto;
        caja.querySelectorAll<HTMLElement>('.opcion').forEach(o => o.classList.toggle('elegida', o.dataset.valor === texto));
        boton.disabled = false;
    }

    function campoEscribir(): HTMLElement[] {
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

    function campoHablar(): HTMLElement[] {
        const mic = crear('button', 'microfono');
        mic.type = 'button';
        mic.setAttribute('aria-label', 'Hablar');
        mic.appendChild(crear('span', 'microfono-icono', '🎙️'));
        mic.appendChild(crear('span', '', 'Toca y habla'));
        const estado = crear('p', 'estado-mic');
        estado.setAttribute('aria-live', 'polite');

        mic.addEventListener('click', () => {
            if (revisado || mic.classList.contains('oyendo')) return;
            mic.classList.add('oyendo');
            estado.textContent = 'Te escucho…';
            Voz.oir().then(dicho => {
                mic.classList.remove('oyendo');
                estado.textContent = '';
                oido = dicho;
                respuesta = dicho[0];
                revisar();
            }).catch((err: Error) => {
                mic.classList.remove('oyendo');
                if (err.message === 'not-allowed' || err.message === 'service-not-allowed') {
                    estado.textContent = 'No hay permiso para el micrófono. Puedes saltarte este ejercicio.';
                } else if (err.message === 'no-speech') {
                    estado.textContent = 'No te escuché, toca otra vez y habla un poco más fuerte.';
                } else {
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
        if (!sesion || !actual) return;
        sesion.hechos++;
        sesion.cola = sesion.cola.map(e => e.tipo === 'hablar' ? cambiarA('inverso', e) : e);
        siguiente();
    }

    let oido: string[] = [];

    // revision de respuestas

    const sinAcentos = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '');

    function limpiar(t: string): string {
        return t.toLowerCase()
            .replace(/[’`´]/g, "'")
            .replace(/[¿?¡!.,;:…]/g, ' ')
            .replace(/\s*-\s*/g, '-')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function distancia(a: string, b: string): number {
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

    type Resultado = { bien: boolean; nota?: string };

    // de lo que entendio el navegador se queda con lo que mas se parece
    function revisarHablado(dicho: string[], correcto: string): Resultado {
        const b = sinAcentos(limpiar(correcto));
        let mejor = 0, frase = dicho[0] ?? '';
        for (const d of dicho) {
            const a = sinAcentos(limpiar(d));
            const parecido = 1 - distancia(a, b) / Math.max(a.length, b.length, 1);
            if (parecido > mejor) { mejor = parecido; frase = d; }
        }
        const nota = 'Escuché «' + frase + '»';
        return { bien: mejor >= .75, nota };
    }

    function revisarEscrito(escrito: string, correcto: string): Resultado {
        const a = limpiar(escrito), b = limpiar(correcto);
        if (a === b) return { bien: true };
        if (sinAcentos(a) === sinAcentos(b)) return { bien: true, nota: 'Ojo con los acentos, se escribe ' + correcto };
        if (b.length > 4 && distancia(sinAcentos(a), sinAcentos(b)) === 1) return { bien: true, nota: 'Casi exacto, se escribe ' + correcto };
        return { bien: false };
    }

    function revisar() {
        if (!sesion || !actual) return;
        const e = actual;
        const correcto = e.tipo === 'elegir' ? e.palabra.es : e.palabra.fr;
        Voz.callar();
        const r: Resultado = e.tipo === 'escribir' ? revisarEscrito(respuesta, correcto)
            : e.tipo === 'hablar' ? revisarHablado(oido, correcto)
            : { bien: respuesta === correcto };

        revisado = true;
        sesion.intentos++;
        caja.querySelectorAll<HTMLButtonElement>('.opcion').forEach(o => {
            o.disabled = true;
            if (o.dataset.valor === correcto) o.classList.add('bien');
            else if (o.dataset.valor === respuesta) o.classList.add('mal');
        });
        const area = caja.querySelector('textarea');
        if (area) area.readOnly = true;
        caja.querySelectorAll<HTMLButtonElement>('.microfono, .saltar').forEach(b => b.disabled = true);

        // al repaso solo cuenta el primer intento, el repetido ya va con la respuesta vista
        if (!sesion.repetidos.has(e)) Repaso.registrar(progreso.tarjetas, e.palabra.fr, r.bien);

        if (r.bien) {
            sesion.aciertos++;
            sesion.hechos++;
        } else if (!sesion.repetidos.has(e)) {
            // lo que fallas regresa al final de la leccion, una sola vez
            sesion.repetidos.add(e);
            sesion.cola.push(e);
            sesion.total++;
            sesion.hechos++;
        } else {
            sesion.hechos++;
        }

        pie.classList.add(r.bien ? 'bien' : 'mal');
        const titulo = crear('b', '', r.bien ? azar(['¡Muy bien!', '¡Exacto!', 'Parfait !', '¡Eso!']) : e.tipo === 'hablar' ? 'Casi, otra vez al final' : 'Respuesta correcta');
        const detalle = crear('span', '', r.bien ? r.nota ?? '' : e.tipo === 'hablar' ? (r.nota ?? '') + ', se dice ' + correcto : correcto);
        if (!r.bien && e.tipo !== 'elegir') detalle.lang = 'fr';
        veredicto.replaceChildren(titulo, detalle);
        boton.textContent = 'Continuar';
        boton.disabled = false;
        boton.focus();

        // al acertar se oye como se dice, asi se queda pegado el sonido con la palabra
        if (r.bien && progreso.voz && e.tipo !== 'elegir' && e.tipo !== 'escuchar') Voz.decir(e.palabra.fr);
    }

    boton.addEventListener('click', () => revisado ? siguiente() : revisar());

    function terminar() {
        if (!sesion) return;
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

        const dato = (n: string, t: string) => {
            const d = crear('div', 'dato');
            d.append(crear('b', '', n), crear('span', '', t));
            return d;
        };
        $('resumen').replaceChildren(
            dato('+' + ganado, 'XP ganada'),
            dato(Math.round(pct * 100) + '%', 'de aciertos'),
            dato('🔥 ' + progreso.racha, progreso.racha === 1 ? 'día de racha' : 'días de racha')
        );
        const extra: string[] = [];
        if (nuevoDia && progreso.racha > 1) extra.push('Tu racha sube a ' + progreso.racha + ' días.');
        if (nivel() > nivelAntes) extra.push('¡Subiste al nivel ' + nivel() + '!');
        if (xpDeHoy() >= META_DIARIA && xpDeHoy() - ganado < META_DIARIA) extra.push('Cumpliste la meta de hoy.');
        if (extra.length) $('fin-frase').textContent += ' ' + extra.join(' ');

        const tip = $('tip');
        if (s.unidad) tip.replaceChildren(crear('b', '', s.unidad.tip.titulo), crear('span', '', s.unidad.tip.texto));
        else tip.replaceChildren();
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
        if (document.body.dataset.pantalla !== 'leccion' || !actual) return;
        const enTexto = ev.target instanceof HTMLTextAreaElement;
        if (ev.key === 'Enter' && !ev.shiftKey) {
            // en el cuadro de texto el enter nunca hace salto de linea
            if (enTexto) ev.preventDefault();
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
        if (enTexto || revisado) return;
        const n = Number(ev.key);
        if (n >= 1 && n <= actual.opciones.length) elegir(actual.opciones[n - 1]);
    });

    irInicio();

    // solo funciona con https o en localhost, en github pages ya hay https
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
        addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
    }
})();
