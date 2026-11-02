import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Videojuego } from '../../models/videojuego.model';
import { VideojuegoService } from '../../services/videojuego-service';

@Component({
  selector: 'app-videojuego-details',
  imports: [FormsModule, RouterLink],
  templateUrl: './videojuego-details.html',
  styleUrl: './videojuego-details.css'
})
export class VideojuegoDetails implements OnInit { // implements OnInit provee el método ngOnInit() que se ejecuta al inicializar el componente
  videojuego?: Videojuego; // El ? indica que la propiedad puede ser undefined
  mensaje = '';

  constructor(
    private readonly route: ActivatedRoute, // ActivatedRoute da acceso a la información de la ruta activa que cargó el componente, como los parámetros de la ruta.
    private readonly router: Router,
    private readonly videojuegoService: VideojuegoService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id')); // transforma el parámetro de la ruta con el id del videojuego a un número. this.route funciona gracias a ActivatedRoute. snapshot es un objeto que representa el estado de la ruta en el momento en que se cargó el componente. paramMap es un mapa de los parámtetros de la ruta para obtener el id.
    this.videojuegoService.get(id).subscribe({
      next: (data) => this.videojuego = data,
      error: () => this.mensaje = 'El videojuego no existe.'
    });
  }

  actualizar(): void {
    if (!this.videojuego?.id) return; // ? evita leer el id si el videojuego no existe (undefined)
    if (!this.videojuego.fecha_lanzamiento) {
      this.videojuego.fecha_lanzamiento = null;
    }
    // Guarda cambios del videojuego y confirma o avisa si falla la actualización.
    this.videojuegoService.update(this.videojuego.id, this.videojuego).subscribe({
      next: (data) => {
        this.videojuego = data;
        this.mensaje = 'Cambios guardados.';
      },
      error: () => this.mensaje = 'No se pudo guardar. Revisá los datos.'
    });
  }

  eliminar(): void {
    if (!this.videojuego?.id || !confirm('¿Eliminar este videojuego?')) return; // confirm() muestra un cuadro de diálogo de confirmación del navegador.
    this.videojuegoService.delete(this.videojuego.id).subscribe({
      next: () => this.router.navigate(['/videojuegos']), // vuelve a la lista de videojuegos si se eliminó correctamente
      error: () => this.mensaje = 'No se pudo eliminar.'
    });
  }
}