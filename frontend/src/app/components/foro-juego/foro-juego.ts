import { Component, Input, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Topico } from '../../models/foro.model';
import { ForoService } from '../../services/foro-service';
import { SesionService } from '../../services/sesion-service';

@Component({
  selector: 'app-foro-juego',
  imports: [FormsModule, RouterLink, DatePipe],
  templateUrl: './foro-juego.html',
  styleUrl: './foro-juego.css'
})
export class ForoJuego implements OnInit {
  @Input({ required: true }) videojuegoId!: number;

  topicos: Topico[] = [];
  creando = false;   // si el formulario de nuevo tópico está abierto
  titulo = '';
  texto = '';

  constructor(
    private readonly foroService: ForoService,
    private readonly toastr: ToastrService,
    private readonly router: Router,
    readonly sesion: SesionService
  ) {}

  ngOnInit(): void {
    this.foroService.getTopicosDeJuego(this.videojuegoId).subscribe(data => this.topicos = data);
  }

  // CU13: crear tópico y entrar a él
  crear(): void {
    const usuarioId = this.sesion.usuarioActual?.id;
    if (!usuarioId) return;
    this.foroService.crearTopico(usuarioId, this.videojuegoId, this.titulo, this.texto).subscribe({
      next: (topico) => {
        this.toastr.success('Tópico creado');
        this.router.navigate(['/topicos', topico.id]);
      },
      error: () => this.toastr.error('No se pudo crear. Título de 5 caracteres o más y texto de 10 o más.')
    });
  }
}
