import { VideojuegoResumen } from './biblioteca-item.model';

// Una reseña tal como la manda /api/resenas/ (mismos campos que el serializer)
export interface Resena {
  id: number;
  usuario: number;
  usuario_nombre: string;        // el username del autor, para mostrarlo
  videojuego: VideojuegoResumen;
  puntaje: number | null;        // el puntaje que el autor le dio al juego en su biblioteca
  texto: string;
  creada: string;
  editada: string;
}
