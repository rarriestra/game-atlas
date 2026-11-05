import { Routes } from '@angular/router';
import { VideojuegoList } from './components/videojuego-list/videojuego-list';
import { VideojuegoAdd } from './components/videojuego-add/videojuego-add';
import { VideojuegoDetails } from './components/videojuego-details/videojuego-details';
import { GeneroList } from './components/genero-list/genero-list';
import { PlataformaList } from './components/plataforma-list/plataforma-list';
import { BibliotecaList } from './components/biblioteca-list/biblioteca-list';
import { soloAdmin } from './guards/solo-admin';

export const routes: Routes = [
  { path: '', redirectTo: 'videojuegos', pathMatch: 'full' },
  { path: 'videojuegos', component: VideojuegoList },
  { path: 'videojuegos/nuevo', component: VideojuegoAdd, canActivate: [soloAdmin] },
  { path: 'videojuegos/:id', component: VideojuegoDetails },
  { path: 'generos', component: GeneroList, canActivate: [soloAdmin] },
  { path: 'plataformas', component: PlataformaList, canActivate: [soloAdmin] },
  { path: 'biblioteca', component: BibliotecaList },   // NUEVO
];