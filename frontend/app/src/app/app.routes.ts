import { Routes } from '@angular/router';

export const routes: Routes = [
  // Esta ruta dice: cuando la URL sea 'detalle/:id', carga el componente 'DetalleComponent'
  { path: 'detalle/:id', loadComponent: () => import('./detalle/detalle').then(m => m.DetalleComponent) }
];