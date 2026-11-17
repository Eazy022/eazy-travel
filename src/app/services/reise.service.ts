import { Injectable, signal } from '@angular/core';
import { ReisePlanung } from '../models/reise.model';

@Injectable({
  providedIn: 'root',
})
export class ReiseService {
  private readonly _reisen = signal<ReisePlanung[]>([
    {
      id: 'reise-1',
      ownerEmail: 'ich@eazy-travel.de',
      teilnehmerEmails: ['ich@eazy-travel.de', 'anna@mail.de', 'tom@mail.de'],
      ziel: 'Rom & Amalfiküste',
      reiseArt: 'rundreise',
      verpflegungsArt: 'restaurant',
      startDatum: '2027-06-10',
      endDatum: '2027-06-20',
      budgetLimit: 2000,
      benoetigtReisepass: false,
      reisepassNummer: '',
      mietwagen: true,
      fuehrerscheinKlasse: 'B',
      vorfreudeSterne: 5,
      mitreisende: [
        { name: 'Ich', email: 'ich@eazy-travel.de' },
        { name: 'Anna', email: 'anna@mail.de' },
        { name: 'Tom', email: 'tom@mail.de' },
      ],
      ausgaben: [
        { titel: 'Flüge nach Rom', kategorie: 'anreise', kosten: 450, bezahltVonEmail: 'ich@eazy-travel.de', gebucht: true },
        { titel: 'Ferienwohnung Trastevere', kategorie: 'unterkunft', kosten: 900, bezahltVonEmail: 'anna@mail.de', gebucht: true },
        { titel: 'Abendessen Trattoria', kategorie: 'restaurant', kosten: 120, bezahltVonEmail: 'ich@eazy-travel.de', gebucht: true },
      ],
      packliste: [
        { gegenstand: 'Führerschein & Kreditkarte', eingepackt: true, istVorschlag: true },
        { gegenstand: 'Bequeme Laufschuhe', eingepackt: false, istVorschlag: true },
      ],
    },
    {
      id: 'reise-2',
      ownerEmail: 'ich@eazy-travel.de',
      teilnehmerEmails: ['ich@eazy-travel.de'],
      ziel: 'Mallorca Strandurlaub',
      reiseArt: 'strand',
      verpflegungsArt: 'all_inclusive',
      startDatum: '2027-08-01',
      endDatum: '2027-08-10',
      budgetLimit: 1800,
      benoetigtReisepass: false,
      reisepassNummer: '',
      mietwagen: false,
      fuehrerscheinKlasse: '',
      vorfreudeSterne: 4,
      mitreisende: [{ name: 'Ich', email: 'ich@eazy-travel.de' }],
      ausgaben: [
        { titel: 'Pauschalreise All Inclusive', kategorie: 'all_inclusive', kosten: 1350, bezahltVonEmail: 'ich@eazy-travel.de', gebucht: true },
      ],
      packliste: [
        { gegenstand: 'Badehose & Sonnenbrille', eingepackt: true, istVorschlag: true },
        { gegenstand: 'Sonnencreme LSF 50', eingepackt: false, istVorschlag: true },
      ],
    },
  ]);

  readonly reisen = this._reisen.asReadonly();

  getReiseById(id: string): ReisePlanung | undefined {
    return this._reisen().find((r) => r.id === id);
  }

  saveReise(reise: ReisePlanung): void {
    this._reisen.update((aktuelleListe) => {
      const existiert = aktuelleListe.some((r) => r.id === reise.id);
      if (existiert) {
        return aktuelleListe.map((r) => (r.id === reise.id ? reise : r));
      }
      return [...aktuelleListe, reise];
    });
  }

  deleteReise(id: string): void {
    this._reisen.update((liste) => liste.filter((r) => r.id !== id));
  }

  exportiereAlsJson(reise: ReisePlanung): void {
    const datenStr = JSON.stringify(reise, null, 2);
    const blob = new Blob([datenStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `eazy-travel-${reise.ziel.toLowerCase().replace(/\s+/g, '-')}.json`;
    link.click();

    URL.revokeObjectURL(url);
  }

  async importiereAusJson(datei: File): Promise<ReisePlanung> {
    const text = await datei.text();
    const importierteReise = JSON.parse(text) as ReisePlanung;

    const neueReise: ReisePlanung = {
      ...importierteReise,
      id: crypto.randomUUID(),
    };

    this.saveReise(neueReise);
    return neueReise;
  }
}
