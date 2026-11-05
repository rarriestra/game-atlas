import { VideojuegoResumen } from './biblioteca-item.model';

// Un elemento del feed (CU03 y CU21). Viene de reseñas, biblioteca o tópicos, siempre con esta forma
export interface Actividad {
  tipo: 'resena' | 'biblioteca' | 'topico';
  id: number;                    // id de la reseña, del item de biblioteca o del tópico
  usuario: number;
  usuario_nombre: string;
  videojuego: VideojuegoResumen;
  texto: string;                 // el texto de la reseña, "lo calificó con 9/10", o el título del tópico
  fecha: string;
}
