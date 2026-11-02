import { ApplicationConfig, provideBrowserGlobalErrorListeners,provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations'; 
import { provideToastr } from 'ngx-toastr';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    provideZoneChangeDetection(),
    provideAnimations(), // activa las animaciones para que ngx-toastr funcione correctamente 
    provideToastr({timeOut: 7500, positionClass: 'toast-bottom-right'}) // Configura los mensajes duran 3 segundos y salen abajo derecha
  ]
};
