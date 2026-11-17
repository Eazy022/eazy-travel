import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
// Angular Material Module importieren
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ReiseService } from '../../services/reise.service';
import { ReisePlanung } from '../../models/reise.model';

@Component({
  selector: 'app-reise-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    CurrencyPipe,
    DatePipe,
    // Alle benötigten Material-Komponenten für das Template freischalten
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MatChipsModule,
    MatTooltipModule,
  ],
  templateUrl: './reise-dashboard.component.html',
  styleUrl: './reise-dashboard.component.scss',
})
export class ReiseDashboardComponent {
  protected readonly reiseService = inject(ReiseService);

  // computed() berechnet automatisch die Gesamtkosten & Budget-Prozente für jede Reise
  protected readonly reisenMitStats = computed(() => {
    return this.reiseService.reisen().map((reise) => {
      const gesamtKosten = reise.ausgaben.reduce((summe, posten) => summe + posten.kosten, 0);
      const budgetProzent = reise.budgetLimit > 0
        ? Math.min(Math.round((gesamtKosten / reise.budgetLimit) * 100), 100)
        : 0;
      const istUeberBudget = gesamtKosten > reise.budgetLimit;

      return {
        ...reise,
        gesamtKosten,
        budgetProzent,
        istUeberBudget,
      };
    });
  });

  onDelete(reise: ReisePlanung): void {
    if (confirm(`Möchtest du die Reise "${reise.ziel}" wirklich löschen?`)) {
      this.reiseService.deleteReise(reise.id);
    }
  }

  onExport(reise: ReisePlanung): void {
    this.reiseService.exportiereAlsJson(reise);
  }

  async onImport(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const datei = input.files?.[0];
    if (!datei) return;

    await this.reiseService.importiereAusJson(datei);
    input.value = '';
  }
}

