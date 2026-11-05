// Un usuario tal como lo manda /api/usuarios/ (mismos campos que el serializer)
export class Usuario {
  id?: number;
  username = '';
  first_name = '';
  last_name = '';
  is_staff = false;   // NUEVO: true = administrador
}