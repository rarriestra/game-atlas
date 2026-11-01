import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Videojuego } from '../../models/videojuego.model';
import { VideojuegoService } from '../../service/videojuego-service';

@Component({
  selector: 'app-videojuego-add',
  imports: [FormsModule, RouterLink],
  templateUrl: './videojuego-add.html',
  styleUrl: './videojuego-add.css'
})
export class VideojuegoAdd {
  videojuego = new Videojuego();
  mensaje = '';

  constructor(
    private readonly videojuegoService: VideojuegoService,
    private readonly router: Router
  ) {}

  guardar(): void {
    if (!this.videojuego.fecha_lanzamiento) {
      this.videojuego.fecha_lanzamiento = null;
    }
    this.videojuegoService.create(this.videojuego).subscribe({
      next: () => this.router.navigate(['/videojuegos']),
      error: () => this.mensaje = 'No se pudo guardar. Revisá los datos.'
    });
  }
}