import { Routes } from '@angular/router';
import { VideojuegoList } from './components/videojuego-list/videojuego-list';
import { VideojuegoAdd } from './components/videojuego-add/videojuego-add';
import { VideojuegoDetails } from './components/videojuego-details/videojuego-details';

export const routes: Routes = [
  { path: '', redirectTo: 'videojuegos', pathMatch: 'full' },
  { path: 'videojuegos', component: VideojuegoList },
  { path: 'videojuegos/nuevo', component: VideojuegoAdd },
  { path: 'videojuegos/:id', component: VideojuegoDetails },
];