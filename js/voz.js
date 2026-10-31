"use strict";
// pronunciacion con la voz que trae el navegador, sin archivos de audio
const Voz = (() => {
    let voz = null;
    const hay = 'speechSynthesis' in window;
    // primero frances de francia y si no cualquier frances, canada o belgica tambien sirven
    function buscarVoz() {
        if (!hay)
            return;
        const todas = speechSynthesis.getVoices().filter(v => v.lang.toLowerCase().startsWith('fr'));
        voz = todas.find(v => v.lang === 'fr-FR' && v.localService)
            || todas.find(v => v.lang === 'fr-FR')
            || todas[0]
            || null;
        avisar();
    }
    // las voces llegan tarde en chrome, por eso hay que avisar cuando ya estan
    const oyentes = [];
    const avisar = () => oyentes.forEach(f => f());
    if (hay) {
        buscarVoz();
        speechSynthesis.addEventListener('voiceschanged', buscarVoz);
    }
    function puedeHablar() {
        return voz !== null;
    }
    function decir(texto, lento = false) {
        return new Promise(listo => {
            if (!voz)
                return listo();
            speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(texto);
            u.voice = voz;
            u.lang = voz.lang;
            u.rate = lento ? .6 : .92;
            u.onend = () => listo();
            u.onerror = () => listo();
            speechSynthesis.speak(u);
        });
    }
    function callar() {
        if (hay)
            speechSynthesis.cancel();
    }
    return { puedeHablar, decir, callar, alCambiar: (f) => oyentes.push(f) };
})();
