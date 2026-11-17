import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';

// Angular Material Module importieren
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';

import { ReiseService } from '../../services/reise.service';
import { berechneUrlaubsTage } from '../../utils/date.utils';

@Component({
    selector: 'app-reise-detail',
    standalone: true,
    imports: [
        RouterLink,
        CurrencyPipe,
        DatePipe,
        MatButtonModule,
        MatCardModule,
        MatIconModule,
        MatChipsModule,
        MatCheckboxModule,
        MatProgressBarModule,
        MatDividerModule
    ],
    templateUrl: './reise-detail.component.html',
    styleUrl: './reise-detail.component.scss',
})
export class ReiseDetailComponent {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly reiseService = inject(ReiseService);

    // Reise-ID aus der URL auslesen (z.B. "reise-1")
    private readonly reiseId = this.route.snapshot.paramMap.get('id') ?? '';

    // computed() holt sich die Reise live aus dem Service-Signal
    // Sobald sich im Service etwas ändert (z.B. beim Abhaken der Packetliste), wird die Komponente automatisch neu gerendert
    protected readonly reise = computed(() => this.reiseService.getReiseById(this.reiseId));
    
    // Berechnet die Gesammtkosten, Budget -Prozent und Reisedauer in Tagen
    protected readonly stats = computed(() => {
        const reise = this.reise();
        if (!reise) return null;

        const gesamtKosten = reise.ausgaben.reduce((summe, ausgabe) => summe + ausgabe.kosten, 0);
        const budgetProzent = reise.budgetLimit > 0
            ?Math.min(Math.round((gesamtKosten / reise.budgetLimit) * 100), 100)
            : 0;
        const istUeberBudget = gesamtKosten > reise.budgetLimit;
        const tage = berechneUrlaubsTage(reise.startDatum, reise.endDatum);

        return { gesamtKosten, budgetProzent, istUeberBudget, tage };
    });

    // Berechnet die Splitweise-Kostenaufteilung für die Lese-Ansicht
    protected readonly kostenSplit = computed(() => {
        const reise = this.reise();
        const stats = this.stats();
        if (!reise || !stats || reise.mitreisende.length === 0) {
            return { anteilProPerson: 0, abrechnung: [] };
        }

        const anteilProPerson = stats.gesamtKosten / reise.mitreisende.length;
        const abrechnung = reise.mitreisende.map((person) => {
            const bezahlt = reise.ausgaben
                .filter((ausgabe) => ausgabe.bezahltVonEmail === person.email)
                .reduce((summe, ausgabe) => summe + ausgabe.kosten, 0);

            return {
                name:person.name || person.email,
                email: person.email,
                bezahlt,
                saldo: bezahlt - anteilProPerson,
            };
        });

        return { anteilProPerson, abrechnung };
    });

    // Ermittelt den Anzeigenamen eines Zahlers anhand seiner E-mail 
    getZahlerName(email: string): string {
        const person = this.reise()?.mitreisende.find((teilnehmer) => teilnehmer.email === email); 
        return person?.name ||email;
    };

    // Packelisten-Punkt direkt in der Detailansicht abhaken und sofort speichern
    togglePacklistenPunkt(index: number): void {
        const aktuelleReise = this.reise();
        if(!aktuelleReise) return;

        const neuePackliste = aktuelleReise.packliste.map((item, i) => 
            i === index ? { ...item, eingepackt: !item.eingepackt } : item
        );

        this.reiseService.saveReise({
            ...aktuelleReise,
            packliste: neuePackliste,
        });
    }

    onExport(): void {
        const reise = this.reise();
        if (reise) this.reiseService.exportiereAlsJson(reise);
    }

    onDelete(): void {
        const reise = this.reise();
        if ( reise && confirm('Möchtestdu "${reise.ziel}" wirklich löschen?')) {
            this.reiseService.deleteReise(reise.id);
            this.router.navigate(['/reisen']);
        }
    }
}