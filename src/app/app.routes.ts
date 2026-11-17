import { Routes } from '@angular/router';
import { ReiseDashboardComponent } from './pages/reise-dashboard/reise-dashboard.component';
import { ReiseDetailComponent } from './pages/reise-detail/reise-detail.component';
import { ReiseEditorComponent } from './pages/reise-editor/reise-editor.component';

export const routes: Routes = [
  { path: '', redirectTo: 'reisen', pathMatch: 'full' },
  { path: 'reisen', component: ReiseDashboardComponent },
  { path: 'reisen/neu', component: ReiseEditorComponent },
  { path: 'reisen/:id', component: ReiseDetailComponent },
  { path: 'reisen/:id/bearbeiten', component: ReiseEditorComponent },
  { path: '**', redirectTo: 'reisen' },
];
