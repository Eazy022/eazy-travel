// Berechnet die Anzahl der Urlaubstage inklusive An- und Abreisetag.
    
    export function berechneUrlaubsTage(startDatum: string, endDatum: string): number {
    if (!startDatum || !endDatum) return 0;

    const startZeitpunkt = new Date(startDatum).getTime();
    const endZeitpunkt = new Date(endDatum).getTime();
    const differenzInMillisekunden = endZeitpunkt - startZeitpunkt;

    if (differenzInMillisekunden < 0) return 0;

    const millisekundenProTag = 1000 * 60 * 60 * 24;
    return Math.round(differenzInMillisekunden / millisekundenProTag) + 1; // +1 für An- und Abreisetag
}