import { Component, DoCheck, Input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { Resena, RespuestaResena } from '../../models/resena.model';
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
  orden = 'recientes';         // NUEVO: 'recientes' o 'votadas'
  respondiendoId?: number;     // NUEVO: id de la reseña que se está respondiendo
  textoRespuesta = '';         // NUEVO
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
    const usuarioId = this.sesion.usuarioActual?.id;
    // NUEVO: se manda el orden y quién mira (para que Django calcule me_gusta)
    this.resenaService.getDeJuego(this.videojuegoId, this.orden, usuarioId)
      .subscribe(data => this.resenas = data);
    this.calificado = false;
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
        // solo se copia el texto: los likes y las respuestas que ya estaban en pantalla se mantienen
        this.resenas = this.resenas.map(r => r.id === actualizada.id
          ? { ...r, texto: actualizada.texto, editada: actualizada.editada } : r);
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

  // NUEVO: cambiar el orden y recargar
  cambiarOrden(orden: string): void {
    this.orden = orden;
    this.cargar();
  }

  // NUEVO: like / quitar like
  like(resena: Resena): void {
    const usuarioId = this.sesion.usuarioActual?.id;
    if (!usuarioId) return;
    this.resenaService.toggleLike(resena.id, usuarioId).subscribe({
      next: (res) => {
        resena.likes = res.likes;        // se actualiza solo esa reseña, sin recargar todo
        resena.me_gusta = res.me_gusta;
      },
      error: () => this.toastr.error('No se pudo registrar el like')
    });
  }

  // NUEVO: abrir el cuadro para responder una reseña
  abrirRespuesta(resena: Resena): void {
    this.respondiendoId = resena.id;
    this.textoRespuesta = '';
  }

  responder(resena: Resena): void {
    const usuarioId = this.sesion.usuarioActual?.id;
    if (!usuarioId) return;
    this.resenaService.responder(resena.id, usuarioId, this.textoRespuesta).subscribe({
      next: (respuesta) => {
        resena.respuestas = [...resena.respuestas, respuesta];   // la nueva va al final
        this.respondiendoId = undefined;
      },
      error: () => this.toastr.error('No se pudo responder')
    });
  }

  // El autor de la respuesta o el admin
  puedeEliminarRespuesta(respuesta: RespuestaResena): boolean {
    return respuesta.usuario === this.sesion.usuarioActual?.id || this.sesion.esAdmin;
  }

  eliminarRespuesta(resena: Resena, respuesta: RespuestaResena): void {
    this.resenaService.eliminarRespuesta(respuesta.id).subscribe({
      next: () => resena.respuestas = resena.respuestas.filter(r => r.id !== respuesta.id),
      error: () => this.toastr.error('No se pudo eliminar la respuesta')
    });
  }
}
