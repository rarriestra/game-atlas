import { VideojuegoResumen } from './biblioteca-item.model';

// Una respuesta a un comentario (un solo nivel: no tiene respuestas propias)
export interface RespuestaComentario {
  id: number;
  usuario: number;
  usuario_nombre: string;
  texto: string;
  respuesta_a: number;   // id del comentario al que responde
  creado: string;
  editado: string;
}

// Un comentario principal de un tópico, con sus respuestas
export interface Comentario extends Omit<RespuestaComentario, 'respuesta_a'> {
  respuesta_a: number | null;   // null = comentario principal
  respuestas: RespuestaComentario[];
}

// Un tópico en la lista del foro
export interface Topico {
  id: number;
  usuario: number;
  usuario_nombre: string;
  videojuego: VideojuegoResumen;
  titulo: string;
  texto: string;
  creado: string;
  editado: string;
  cantidad_comentarios: number;
  ultima_actividad: string;
}

// Un tópico abierto: lo mismo + los comentarios
export interface TopicoDetalle extends Topico {
  comentarios: Comentario[];
}
