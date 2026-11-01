export class Videojuego {
  id?: number;
  titulo = '';
  sinopsis = '';
  portada_url = '';
  fecha_lanzamiento: string | null = null;
  desarrollador = '';
  distribuidor = '';
  generos: number[] = [];
  plataformas: number[] = [];
}

export interface ApiResponse<T> {
  status: string;
  data: T;
}