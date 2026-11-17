import { Routes } from '@angular/router';
import { ReiseDashboardComponent } from './pages/reise-dashboard/reise-dashboard.component';
import { ReiseEditorComponent } from './pages/reise-editor/reise-editor.component';

export const routes: Routes = [
    { path: '', redirectTo: 'reisen', pathMatch: 'full' },
    { path: 'reisen', component: ReiseDashboardComponent },
    { path: 'reisen/:id', component: ReiseEditorComponent },
    { path: '**', redirectTo: 'reisen' },
];
