import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
// Signal Forms API inklusive applyEach (für Listen) und email
import {
  form,
  FormField,
  required,
  min,
  hidden,
  disabled,
  validate,
  applyEach,
  email,
} from '@angular/forms/signals';

// Angular Material Module
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';

import { ReiseService } from '../../services/reise.service';
import { ReisePlanung } from '../../models/reise.model';
import { berechneUrlaubsTage } from '../../utils/date.utils';

@Component({
  selector: 'app-reise-editor',
  standalone: true,
  imports: [
    RouterLink,
    CurrencyPipe,
    FormField,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
  ],
  templateUrl: './reise-editor.component.html',
  styleUrl: './reise-editor.component.scss',
})
export class ReiseEditorComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly reiseService = inject(ReiseService);

  protected readonly istNeueReise = signal(true);

  // Signal für das Eingabefeld eines eigenen Packlisten-Gegenstands
  protected readonly neuerPacklistenPunkt = signal('');

  // 1. ZENTRALES DATENMODELL ALS SIGNAL
  protected readonly reiseModel = signal<ReisePlanung>({
    id: crypto.randomUUID(),
    ownerEmail: 'ich@eazy-travel.de',
    teilnehmerEmails: ['ich@eazy-travel.de'],
    ziel: '',
    reiseArt: 'strand',
    verpflegungsArt: 'restaurant',
    startDatum: '',
    endDatum: '',
    budgetLimit: 1000,
    benoetigtReisepass: false,
    reisepassNummer: '',
    mietwagen: false,
    fuehrerscheinKlasse: 'B',
    ausgaben: [],
    mitreisende: [{ name: 'Ich', email: 'ich@eazy-travel.de' }],
    packliste: [],
    vorfreudeSterne: 4,
  });

  // 2. SIGNAL FORM MIT REGELN FÜR ALLE FELDER UND LISTEN
  protected readonly reiseForm = form(this.reiseModel, (p) => {
    // Basisdaten
    required(p.ziel, { message: 'Bitte gib ein Reiseziel an.' });
    required(p.startDatum, { message: 'Bitte wähle ein Startdatum.' });
    required(p.endDatum, { message: 'Bitte wähle ein Enddatum.' });
    min(p.budgetLimit, 0, { message: 'Das Budget darf nicht negativ sein.' });

    // Eigene Datums-Prüfung
    validate(p.endDatum, ({ value, valueOf }) => {
      const ende = value();
      const start = valueOf(p.startDatum);
      if (!start || !ende) return null;
      return ende < start
        ? { kind: 'datumUngueltig', message: 'Das Enddatum darf nicht vor dem Startdatum liegen!' }
        : null;
    });

    // Reisepass (hidden + required)
    hidden(p.reisepassNummer, { when: ({ valueOf }) => !valueOf(p.benoetigtReisepass) });
    required(p.reisepassNummer, {
      when: ({ valueOf }) => valueOf(p.benoetigtReisepass),
      message: 'Bitte gib deine Reisepassnummer ein.',
    });

    // Mietwagen (disabled + required)
    disabled(p.fuehrerscheinKlasse, { when: ({ valueOf }) => !valueOf(p.mietwagen) });
    required(p.fuehrerscheinKlasse, {
      when: ({ valueOf }) => valueOf(p.mietwagen),
      message: 'Bitte wähle eine Führerscheinklasse.',
    });

    // NEU: applyEach prüft automatisch JEDEN Eintrag in der Mitreisenden-Liste
    applyEach(p.mitreisende, (person) => {
      required(person.name, { message: 'Name fehlt' });
      required(person.email, { message: 'E-Mail fehlt' });
      email(person.email, { message: 'Ungültige E-Mail' });
    });

    // NEU: applyEach prüft automatisch JEDEN Eintrag in der Ausgaben-Liste
    applyEach(p.ausgaben, (ausgabe) => {
      required(ausgabe.titel, { message: 'Beschreibung fehlt' });
      min(ausgabe.kosten, 0.01, { message: 'Betrag > 0 €' });
      required(ausgabe.bezahltVonEmail, { message: 'Zahler wählen' });
    });
  });

  // 3. LIVE-BERECHNUNG: URLAUBSTAGE
  protected readonly urlaubsTage = computed(() => 
    berechneUrlaubsTage(this.reiseModel().startDatum, this.reiseModel().endDatum)
  );

  // 4. LIVE-BERECHNUNG: BUDGET-AMPEL
  protected readonly budgetStatus = computed(() => {
    const ausgabenSumme = this.reiseModel().ausgaben.reduce((sum, a) => sum + (Number(a.kosten) || 0), 0);
    const limit = this.reiseModel().budgetLimit;
    return {
      ausgabenSumme,
      restBudget: limit - ausgabenSumme,
      istUeberzogen: ausgabenSumme > limit,
    };
  });

  // 5. LIVE-BERECHNUNG: SPLITWISE-KOSTENRECHNER
  protected readonly kostenSplit = computed(() => {
    const daten = this.reiseModel();
    const personen = daten.mitreisende;
    const gesamtKosten = this.budgetStatus().ausgabenSumme;

    if (personen.length === 0) {
      return { anteilProPerson: 0, abrechnung: [] };
    }

    // Gesamtkosten gleichmäßig durch alle Mitreisenden teilen
    const anteilProPerson = gesamtKosten / personen.length;

    // Für jede Person ausrechnen, wie viel sie vorgestreckt hat und wie ihr Saldo ist
    const abrechnung = personen.map((person) => {
      const bezahlt = daten.ausgaben
        .filter((a) => a.bezahltVonEmail === person.email)
        .reduce((sum, a) => sum + (Number(a.kosten) || 0), 0);

      // Positiv = Guthaben (bekommt Geld zurück); Negativ = Schulden (muss noch zahlen)
      const saldo = bezahlt - anteilProPerson;

      return {
        name: person.name || person.email,
        email: person.email,
        bezahlt,
        saldo,
      };
    });

    return { anteilProPerson, abrechnung };
  });

  // 6. LIVE-BERECHNUNG: INTELLIGENTE PACKLISTEN-VORSCHLÄGE
  protected readonly packlistenVorschlaege = computed(() => {
    const daten = this.reiseModel();
    const tage = this.urlaubsTage();
    const vorschlaege: string[] = [];

    // Vorschläge anhand der Reisedauer
    if (tage > 0) {
      vorschlaege.push(`${tage}x Unterwäsche & Socken`);
      vorschlaege.push(`${Math.ceil(tage / 2)}x Oberteile / T-Shirts`);
    }

    // Vorschläge anhand der Reiseart
    if (daten.reiseArt === 'strand') {
      vorschlaege.push('Badesachen & Strandtuch', 'Sonnencreme LSF 50', 'Sonnenbrille');
    } else if (daten.reiseArt === 'camping') {
      vorschlaege.push('Zelt & Heringe', 'Schlafsack & Isomatte', 'Taschenlampe / Stirnlampe');
    } else if (daten.reiseArt === 'staedtetrip') {
      vorschlaege.push('Bequeme Laufschuhe', 'Tagesrucksack', 'Powerbank');
    } else if (daten.reiseArt === 'rundreise') {
      vorschlaege.push('Reiseapotheke', 'Offline-Karten herunterladen');
    }

    // Vorschläge anhand der Verpflegungsart
    if (daten.verpflegungsArt === 'selbstverpflegung') {
      vorschlaege.push('Geschirrtuch & Spülmittel', 'Gewürz-Set & Einkaufstasche');
    }

    // Vorschläge anhand der Checkboxen
    if (daten.benoetigtReisepass) {
      vorschlaege.push('Reisepass (Gültigkeit prüfen!)');
    }
    if (daten.mietwagen) {
      vorschlaege.push('Führerschein & Kreditkarte (für Kaution)');
    }

    // Nur Vorschläge anzeigen, die noch nicht auf der Packliste stehen
    const bereitsVorhanden = new Set(daten.packliste.map((p) => p.gegenstand));
    return vorschlaege.filter((v) => !bereitsVorhanden.has(v));
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'neu') {
      const vorhandeneReise = this.reiseService.getReiseById(id);
      if (vorhandeneReise) {
        this.istNeueReise.set(false);
        this.reiseModel.set(structuredClone(vorhandeneReise));
      }
    }
  }

  // --- METHODEN FÜR MITREISENDE ---
  mitreisendenHinzufuegen(): void {
    this.reiseModel.update((m) => ({
      ...m,
      mitreisende: [...m.mitreisende, { name: '', email: '' }],
    }));
  }

  mitreisendenEntfernen(index: number): void {
    this.reiseModel.update((m) => ({
      ...m,
      mitreisende: m.mitreisende.filter((_, i) => i !== index),
    }));
  }

  // --- METHODEN FÜR AUSGABEN ---
  ausgabeHinzufuegen(): void {
    const standardZahler = this.reiseModel().mitreisende[0]?.email ?? '';
    this.reiseModel.update((m) => ({
      ...m,
      ausgaben: [
        ...m.ausgaben,
        { titel: '', kategorie: 'aktivitaet', kosten: 0, bezahltVonEmail: standardZahler, gebucht: false },
      ],
    }));
  }

  ausgabeEntfernen(index: number): void {
    this.reiseModel.update((m) => ({
      ...m,
      ausgaben: m.ausgaben.filter((_, i) => i !== index),
    }));
  }

  // --- METHODEN FÜR PACKLISTE ---
  packlistenPunktHinzufuegen(gegenstand: string, istVorschlag = false): void {
    const text = gegenstand.trim();
    if (!text) return;

    this.reiseModel.update((m) => ({
      ...m,
      packliste: [...m.packliste, { gegenstand: text, eingepackt: false, istVorschlag }],
    }));

    if (!istVorschlag) {
      this.neuerPacklistenPunkt.set('');
    }
  }

  packlistenPunktEntfernen(index: number): void {
    this.reiseModel.update((m) => ({
      ...m,
      packliste: m.packliste.filter((_, i) => i !== index),
    }));
  }

  // --- SPEICHERN ---
  speichern(): void {
    if (this.reiseForm().invalid()) {
      this.reiseForm().markAsTouched();
      return;
    }

    // Alle E-Mails der Mitreisenden für die späteren Firebase-Berechtigungen sammeln
    const alleEmails = Array.from(
      new Set([
        this.reiseModel().ownerEmail,
        ...this.reiseModel().mitreisende.map((p) => p.email.trim()).filter(Boolean),
      ])
    );

    const fertigeReise: ReisePlanung = {
      ...this.reiseModel(),
      teilnehmerEmails: alleEmails,
    };

    this.reiseService.saveReise(fertigeReise);
    this.router.navigate(['/reisen']);
  }
}