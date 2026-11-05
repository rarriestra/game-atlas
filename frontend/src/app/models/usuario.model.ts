// Un usuario tal como lo manda /api/usuarios/ (mismos campos que el serializer)
export class Usuario {
  id?: number;
  username = '';
  first_name = '';
  last_name = '';
  is_staff = false;   // NUEVO: true = administrador
}

// NUEVO (Guía 10): el usuario con sus datos sociales (lo que manda /api/usuarios/5/)
export interface PerfilUsuario extends Usuario {
  seguidores: number;   // cuántos lo siguen
  siguiendo: number;    // a cuántos sigue
  lo_sigo: boolean;     // si el usuario elegido en la navbar ya lo sigue
}