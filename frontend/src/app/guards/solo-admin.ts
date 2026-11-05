import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SesionService } from '../services/sesion-service';

// Deja entrar solo al administrador; a los demás los manda al catálogo
export const soloAdmin: CanActivateFn = () => {
  const sesion = inject(SesionService);
  return sesion.esAdmin ? true : inject(Router).createUrlTree(['/videojuegos']);
};
