import { VideojuegoResumen } from './biblioteca-item.model';

// NUEVO (Guía 8): una respuesta debajo de una reseña
export interface RespuestaResena {
  id: number;
  usuario: number;
  usuario_nombre: string;
  texto: string;
  creada: string;
}

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
  likes: number;                 // NUEVO: cantidad de "me gusta"
  me_gusta: boolean;             // NUEVO: si el usuario que mira ya le dio like
  respuestas: RespuestaResena[]; // NUEVO: la conversación debajo de la reseña
}
