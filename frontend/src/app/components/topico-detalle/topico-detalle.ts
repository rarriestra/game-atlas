import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { Comentario, RespuestaComentario, TopicoDetalle } from '../../models/foro.model';
import { ForoService } from '../../services/foro-service';
import { SesionService } from '../../services/sesion-service';

@Component({
  selector: 'app-topico-detalle',
  imports: [FormsModule, RouterLink, DatePipe],
  templateUrl: './topico-detalle.html',
  styleUrl: './topico-detalle.css'
})
export class TopicoDetalleComponent implements OnInit {
  topico?: TopicoDetalle;
  mensaje = '';

  textoComentario = '';          // CU16: comentario principal nuevo
  respondiendoA?: number;        // id del comentario principal al que se está respondiendo
  textoRespuesta = '';
  editandoId?: number;           // id del comentario o respuesta que se está editando
  textoEdicion = '';
  editandoTopico = false;        // CU14
  tituloEdicion = '';
  textoTopicoEdicion = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly foroService: ForoService,
    private readonly toastr: ToastrService,
    readonly sesion: SesionService
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  // CU12: trae el tópico con todos sus comentarios
  cargar(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.foroService.getTopico(id).subscribe({
      next: (data) => this.topico = data,
      error: () => this.mensaje = 'El tópico no existe.'
    });
  }

  // El autor puede editar; el autor o el admin pueden borrar
  esMio(usuarioId: number): boolean {
    return usuarioId === this.sesion.usuarioActual?.id;
  }

  puedeBorrar(usuarioId: number): boolean {
    return this.esMio(usuarioId) || this.sesion.esAdmin;
  }

  // ---------- Tópico ----------

  editarTopico(): void {
    if (!this.topico) return;
    this.editandoTopico = true;
    this.tituloEdicion = this.topico.titulo;
    this.textoTopicoEdicion = this.topico.texto;
  }

  // CU14
  guardarTopico(): void {
    if (!this.topico) return;
    this.foroService.editarTopico(this.topico.id, this.tituloEdicion, this.textoTopicoEdicion).subscribe({
      next: (actualizado) => {
        if (!this.topico) return;
        this.topico.titulo = actualizado.titulo;
        this.topico.texto = actualizado.texto;
        this.editandoTopico = false;
        this.toastr.success('Tópico editado');
      },
      error: () => this.toastr.error('No se pudo guardar')
    });
  }

  // CU15: al borrar el tópico, vuelve a la ficha del juego
  eliminarTopico(): void {
    if (!this.topico) return;
    const { id, videojuego } = this.topico;
    Swal.fire({
      title: '¿Eliminar el tópico?',
      text: 'Se borran también todos sus comentarios.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545'
    }).then((resultado) => {
      if (!resultado.isConfirmed) return;
      this.foroService.eliminarTopico(id).subscribe({
        next: () => {
          this.toastr.success('Tópico eliminado');
          this.router.navigate(['/videojuegos', videojuego.id]);
        },
        error: () => this.toastr.error('No se pudo eliminar')
      });
    });
  }

  // ---------- Comentarios ----------

  // CU16: comentario principal
  comentar(): void {
    const usuarioId = this.sesion.usuarioActual?.id;
    if (!usuarioId || !this.topico) return;
    this.foroService.comentar(this.topico.id, usuarioId, this.textoComentario).subscribe({
      next: () => {
        this.textoComentario = '';
        this.cargar();
      },
      error: () => this.toastr.error('No se pudo comentar')
    });
  }

  // Abre el cuadro de respuesta debajo de un comentario principal.
  // Si se responde a una respuesta, se arranca el texto con @nombre para que se entienda a quién
  abrirRespuesta(principal: Comentario, aQuien?: RespuestaComentario): void {
    this.respondiendoA = principal.id;
    this.textoRespuesta = aQuien ? `@${aQuien.usuario_nombre} ` : '';
  }

  // CU16: respuesta (siempre se cuelga del comentario principal: un solo nivel)
  responder(principal: Comentario): void {
    const usuarioId = this.sesion.usuarioActual?.id;
    if (!usuarioId || !this.topico) return;
    this.foroService.comentar(this.topico.id, usuarioId, this.textoRespuesta, principal.id).subscribe({
      next: () => {
        this.respondiendoA = undefined;
        this.cargar();
      },
      error: () => this.toastr.error('No se pudo responder')
    });
  }

  // CU17: sirve para comentarios y para respuestas (los dos tienen id y texto)
  editar(c: { id: number; texto: string }): void {
    this.editandoId = c.id;
    this.textoEdicion = c.texto;
  }

  guardarEdicion(c: { id: number; texto: string }): void {
    this.foroService.editarComentario(c.id, this.textoEdicion).subscribe({
      next: (actualizado) => {
        c.texto = actualizado.texto;   // se actualiza en pantalla sin recargar
        this.editandoId = undefined;
      },
      error: () => this.toastr.error('No se pudo guardar')
    });
  }

  // CU18
  eliminarComentario(id: number): void {
    Swal.fire({
      title: '¿Eliminar el comentario?',
      text: 'Si tiene respuestas, se borran también.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545'
    }).then((resultado) => {
      if (!resultado.isConfirmed) return;
      this.foroService.eliminarComentario(id).subscribe({
        next: () => this.cargar(),
        error: () => this.toastr.error('No se pudo eliminar')
      });
    });
  }
}
