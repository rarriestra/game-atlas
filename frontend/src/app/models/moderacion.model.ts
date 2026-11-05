// Lo que se puede reportar (los mismos valores que Reporte.Tipo en Django)
export type TipoContenido = 'RESENA' | 'TOPICO' | 'COMENTARIO';

// Un reporte, como lo manda /api/reportes/ (CU23 y CU24)
export interface Reporte {
  id: number;
  reportante: number;
  reportante_nombre: string;
  tipo: TipoContenido;
  tipo_texto: string;            // 'Reseña', 'Tópico', 'Comentario'
  contenido_id: number;
  autor: number;                 // quién escribió el contenido reportado
  autor_nombre: string;
  texto: string;                 // copia del contenido (sigue aunque se elimine)
  motivo: string;
  estado: 'PENDIENTE' | 'ELIMINADO' | 'DESCARTADO';
  estado_texto: string;
  moderador_nombre: string | null;
  creado: string;
  resuelto: string | null;
  // Dónde está el contenido; null si ya fue eliminado
  ubicacion: { videojuego: { id: number; titulo: string }; topico: number | null } | null;
  sanciones_autor: number;
}

export type TipoSancion = 'ADVERTENCIA' | 'SUSPENSION';

// Una sanción (CU26)
export interface Sancion {
  id: number;
  usuario: number;
  usuario_nombre: string;
  tipo: TipoSancion;
  tipo_texto: string;
  motivo: string;
  reporte: number | null;
  moderador_nombre: string | null;
  inicio: string;
  fin: string | null;            // solo las suspensiones
  vigente: boolean;              // true = suspensión que todavía no terminó
}
