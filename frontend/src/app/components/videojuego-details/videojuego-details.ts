import { Component, OnInit } from '@angular/core';
import { NgClass } from '@angular/common';               // para la validación visual (is-invalid)
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';              // avisos en la esquina
import Swal from 'sweetalert2';                            // cartel de confirmación
import { Genero } from '../../models/genero.model';        
import { Plataforma } from '../../models/plataforma.model'; 
import { Videojuego } from '../../models/videojuego.model';
import { GeneroService } from '../../services/genero-service';         
import { PlataformaService } from '../../services/plataforma-service'; 
import { VideojuegoService } from '../../services/videojuego-service';
import { SesionService } from '../../services/sesion-service';
import { BibliotecaPanel } from '../biblioteca-panel/biblioteca-panel';
import { ResenasJuego } from '../resenas-juego/resenas-juego';

@Component({
  selector: 'app-videojuego-details',
  imports: [FormsModule, NgClass, RouterLink, BibliotecaPanel, ResenasJuego], // NgClass
  templateUrl: './videojuego-details.html',
  styleUrl: './videojuego-details.css'
})
export class VideojuegoDetails implements OnInit { // implements OnInit provee el método ngOnInit() que se ejecuta al inicializar el componente
  videojuego?: Videojuego; // El ? indica que la propiedad puede ser undefined
  generos: Genero[] = [];          // lista para dibujar las casillas de géneros
  plataformas: Plataforma[] = [];  // lista para las casillas de plataformas
  mensaje = ''; // ahora solo se usa para "El videojuego no existe"
  version = 0;  // NUEVO: sube cada vez que cambia algo en "Mi biblioteca" (avisa a las reseñas)

  constructor(
    private readonly route: ActivatedRoute, // ActivatedRoute da acceso a la información de la ruta activa que cargó el componente, como los parámetros de la ruta.
    private readonly router: Router,
    private readonly videojuegoService: VideojuegoService,
    private readonly generoService: GeneroService,         
    private readonly plataformaService: PlataformaService, 
    private readonly toastr: ToastrService,
    readonly sesion: SesionService   // NUEVO
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id')); // transforma el parámetro de la ruta con el id del videojuego a un número. this.route funciona gracias a ActivatedRoute. snapshot es un objeto que representa el estado de la ruta en el momento en que se cargó el componente. paramMap es un mapa de los parámetros de la ruta para obtener el id.
    this.videojuegoService.get(id).subscribe({
      next: (data) => this.videojuego = data,
      error: () => this.mensaje = 'El videojuego no existe.'
    });
    // trae todos los géneros y plataformas para armar las casillas
    this.generoService.getAll().subscribe(data => this.generos = data);
    this.plataformaService.getAll().subscribe(data => this.plataformas = data);
  }

  // true si el juego ya tiene ese género (la casilla aparece tildada).
  // ?. por si el juego todavía no llegó; !! convierte el resultado en true/false
  tieneGenero(genero: Genero): boolean {
    return !!this.videojuego?.generos.some(g => g.id === genero.id);
  }

  // al hacer clic en la casilla, si lo tiene lo saca (filter); si no, lo agrega (...)
  alternarGenero(genero: Genero): void {
    if (!this.videojuego) return;
    this.videojuego.generos = this.tieneGenero(genero)
      ? this.videojuego.generos.filter(g => g.id !== genero.id)
      : [...this.videojuego.generos, genero];
  }

  // lo mismo para plataformas
  tienePlataforma(plataforma: Plataforma): boolean {
    return !!this.videojuego?.plataformas.some(p => p.id === plataforma.id);
  }

  alternarPlataforma(plataforma: Plataforma): void {
    if (!this.videojuego) return;
    this.videojuego.plataformas = this.tienePlataforma(plataforma)
      ? this.videojuego.plataformas.filter(p => p.id !== plataforma.id)
      : [...this.videojuego.plataformas, plataforma];
  }

  // NUEVO: el panel avisa que cambió un puntaje; se pide el juego de nuevo solo para el promedio
  actualizarPromedio(): void {
    if (!this.videojuego?.id) return;
    this.version++;   // NUEVO: las reseñas vuelven a revisar si ya calificaste
    this.videojuegoService.get(this.videojuego.id).subscribe(data => {
      if (!this.videojuego) return;
      this.videojuego.puntaje_promedio = data.puntaje_promedio;
      this.videojuego.cantidad_puntajes = data.cantidad_puntajes;
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
        this.toastr.success('Cambios guardados'); // toast en vez de mensaje
      },
      error: () => this.toastr.error('No se pudo guardar. Revisá los datos.') 
    });
  }

  eliminar(): void {
    if (!this.videojuego?.id) return;
    const id = this.videojuego.id; // se guarda antes, porque adentro del .then() TypeScript ya no garantiza que exista
    // SweetAlert reemplaza a confirm(), el cuadro de diálogo de confirmación del navegador.
    // Es asincrónico: la respuesta del usuario llega en el .then()
    Swal.fire({
      title: '¿Eliminar videojuego?',
      text: `Se va a borrar "${this.videojuego.titulo}".`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545'
    }).then((resultado) => {
      if (!resultado.isConfirmed) return; // tocó Cancelar: no hace nada
      this.videojuegoService.delete(id).subscribe({
        next: () => {
          this.toastr.success('Videojuego eliminado');
          this.router.navigate(['/videojuegos']); // vuelve a la lista de videojuegos si se eliminó correctamente
        },
        error: () => this.toastr.error('No se pudo eliminar')
      });
    });
  }
}