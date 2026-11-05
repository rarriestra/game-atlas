import { VideojuegoResumen } from './biblioteca-item.model';

// Lista personal (CU09 a CU11): lo que manda /api/listas/
export interface Lista {
  id: number;
  usuario: number;
  usuario_nombre: string;
  nombre: string;
  descripcion: string;
  videojuegos: VideojuegoResumen[];   // los juegos, con título y portada
  creada: string;
  actualizada: string;
}
