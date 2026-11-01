import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms'; // Importa FormsModule para usar ngModel en el formulario
import { Router, RouterLink } from '@angular/router';
import { Videojuego } from '../../models/videojuego.model';
import { VideojuegoService } from '../../service/videojuego-service';

@Component({
  selector: 'app-videojuego-add',
  imports: [FormsModule, RouterLink],
  templateUrl: './videojuego-add.html',
  styleUrl: './videojuego-add.css'
})
export class VideojuegoAdd { // export class VideojuegoAdd para poder usarlo en otros archivos (clase cerrada)
  videojuego = new Videojuego();
  mensaje = '';

  constructor(
    private readonly videojuegoService: VideojuegoService,
    private readonly router: Router
  ) {}

  guardar(): void { // método al apretar el botón de Guardar
    if (!this.videojuego.fecha_lanzamiento) {
      this.videojuego.fecha_lanzamiento = null; // enviamos null a Django si no se selecciona ninguna fecha, para que no rompa la validación del modelo
    }
    this.videojuegoService.create(this.videojuego).subscribe({ // llamamos al método create del servicio VideojuegoService y .subscribe para manejar la respuesta
      next: () => this.router.navigate(['/videojuegos']), // función flecha (especie de Lambda) que redirige a la lista de videojuegos si se guarda correctamente. El () indica que no recibe parámetros.
      error: () => this.mensaje = 'No se pudo guardar. Revisá los datos.'
    });
  }
}