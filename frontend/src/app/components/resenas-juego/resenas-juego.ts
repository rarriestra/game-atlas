import { Component, DoCheck, Input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { Resena } from '../../models/resena.model';
import { BibliotecaService } from '../../services/biblioteca-service';
import { ResenaService } from '../../services/resena-service';
import { SesionService } from '../../services/sesion-service';

@Component({
  selector: 'app-resenas-juego',
  imports: [FormsModule, RouterLink, DatePipe],
  templateUrl: './resenas-juego.html',
  styleUrl: './resenas-juego.css'
})
export class ResenasJuego implements DoCheck {
  @Input({ required: true }) videojuegoId!: number;
  // La ficha lo aumenta cada vez que cambia algo en "Mi biblioteca" (por ejemplo, calificaste),
  // así esta sección vuelve a revisar si ya podés escribir una reseña
  @Input() version = 0;

  resenas: Resena[] = [];
  calificado = false;        // CU06: true si el usuario actual ya le puso puntaje a este juego
  texto = '';                // lo que se escribe en el formulario de nueva reseña
  editandoId?: number;       // id de la reseña que se está editando (undefined = ninguna)
  textoEdicion = '';
  private claveCargada = ''; // "usuario-version" de la última carga

  constructor(
    private readonly resenaService: ResenaService,
    private readonly bibliotecaService: BibliotecaService,
    private readonly toastr: ToastrService,
    readonly sesion: SesionService
  ) {}

  // Recarga si cambió el usuario de la navbar o la versión que manda la ficha
  ngDoCheck(): void {
    const clave = `${this.sesion.usuarioActual?.id}-${this.version}`;
    if (clave !== this.claveCargada) {
      this.claveCargada = clave;
      this.cargar();
    }
  }

  // La reseña del usuario actual, si ya escribió una
  get miResena(): Resena | undefined {
    return this.resenas.find(r => r.usuario === this.sesion.usuarioActual?.id);
  }

  // Puede borrar el autor, y también el administrador (moderación)
  puedeEliminar(resena: Resena): boolean {
    return resena.usuario === this.sesion.usuarioActual?.id || this.sesion.esAdmin;
  }

  cargar(): void {
    this.resenaService.getDeJuego(this.videojuegoId).subscribe(data => this.resenas = data);
    this.calificado = false;
    const usuarioId = this.sesion.usuarioActual?.id;
    if (!usuarioId) return;
    this.bibliotecaService.getItem(usuarioId, this.videojuegoId)
      .subscribe(item => this.calificado = !!item?.puntaje);
  }

  // CU06: publicar
  publicar(): void {
    const usuarioId = this.sesion.usuarioActual?.id;
    if (!usuarioId) return;
    this.resenaService.crear(usuarioId, this.videojuegoId, this.texto).subscribe({
      next: (resena) => {
        this.resenas = [resena, ...this.resenas];   // la nueva va primera
        this.texto = '';
        this.toastr.success('Reseña publicada');
      },
      error: () => this.toastr.error('No se pudo publicar. Revisá que el juego esté calificado.')
    });
  }

  // CU07: editar (pasa el texto al cuadro de edición)
  editar(resena: Resena): void {
    this.editandoId = resena.id;
    this.textoEdicion = resena.texto;
  }

  guardarEdicion(resena: Resena): void {
    this.resenaService.editar(resena.id, this.textoEdicion).subscribe({
      next: (actualizada) => {
        this.resenas = this.resenas.map(r => r.id === actualizada.id ? actualizada : r);
        this.editandoId = undefined;
        this.toastr.success('Reseña editada');
      },
      error: () => this.toastr.error('No se pudo guardar. Mínimo 10 caracteres.')
    });
  }

  // CU08: eliminar con confirmación
  eliminar(resena: Resena): void {
    Swal.fire({
      title: '¿Eliminar la reseña?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545'
    }).then((resultado) => {
      if (!resultado.isConfirmed) return;
      this.resenaService.eliminar(resena.id).subscribe({
        next: () => {
          this.resenas = this.resenas.filter(r => r.id !== resena.id);
          this.toastr.success('Reseña eliminada');
        },
        error: () => this.toastr.error('No se pudo eliminar')
      });
    });
  }
}
