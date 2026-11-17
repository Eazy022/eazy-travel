export type ReiseArt = 'strand' | 'staedtetrip' | 'camping' | 'rundreise';

export type VerpflegungsArt =
  | 'all_inclusive'     // Essen im Hotel (All Inclusive)
  | 'restaurant'        // Essen außerhalb (Restaurant)
  | 'selbstverpflegung'; // Selbstverpflegung (Kochen)

export type KostenKategorie =
  | 'anreise'
  | 'unterkunft'
  | 'mietwagen'
  | 'all_inclusive'
  | 'restaurant'
  | 'selbstverpflegung'
  | 'aktivitaet'
  | 'sonstiges';

export interface ReiseAusgabe {
  titel: string;
  kategorie: KostenKategorie;
  kosten: number;
  bezahltVonEmail: string; 
  gebucht: boolean;
}

export interface Mitreisender {
  name: string;
  email: string;
}

export interface PacklistenEintrag {
  gegenstand: string;
  eingepackt: boolean;
  istVorschlag: boolean;
}

export interface ReisePlanung {
  id: string;
  ownerEmail: string;
  teilnehmerEmails: string[];

  // 1. Basisdaten & Budget
  ziel: string;
  reiseArt: ReiseArt;
  verpflegungsArt: VerpflegungsArt;
  startDatum: string;
  endDatum: string;
  budgetLimit: number;

  // 2. Bedingte Optionen
  benoetigtReisepass: boolean;
  reisepassNummer: string;
  mietwagen: boolean;
  fuehrerscheinKlasse: string;

  // 3. Dynamische Listen & Bewertung
  ausgaben: ReiseAusgabe[];
  mitreisende: Mitreisender[];
  packliste: PacklistenEintrag[];
  vorfreudeSterne: number;
}
