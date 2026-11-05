import { Component, Input, OnChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Lista } from '../../models/lista.model';
import { ListaService } from '../../services/lista-service';
import { SesionService } from '../../services/sesion-service';

@Component({
  selector: 'app-listas-usuario',
  imports: [FormsModule, RouterLink],
  templateUrl: './listas-usuario.html',
  styleUrl: './listas-usuario.css'
})
export class ListasUsuario implements OnChanges {
  @Input({ required: true }) usuarioId!: number;   // de quién es el perfil

  listas: Lista[] = [];
  creando = false;      // muestra el formulario de nueva lista
  nombre = '';
  descripcion = '';

  constructor(
    private readonly listaService: ListaService,
    private readonly router: Router,
    private readonly toastr: ToastrService,
    readonly sesion: SesionService
  ) {}

  // ngOnChanges se ejecuta cada vez que cambia un @Input.
  // Si pasás del perfil de ana al de beto, cambia usuarioId y se recargan las listas
  ngOnChanges(): void {
    this.creando = false;
    this.listaService.getDeUsuario(this.usuarioId).subscribe(data => this.listas = data);
  }

  // Solo el dueño del perfil puede crear listas
  get esMiPerfil(): boolean {
    return this.sesion.usuarioActual?.id === this.usuarioId;
  }

  // CU09: crear y llevar a la lista nueva, para empezar a agregarle juegos
  crear(): void {
    this.listaService.crear(this.usuarioId, this.nombre.trim(), this.descripcion.trim()).subscribe({
      next: (lista) => {
        this.toastr.success('Lista creada');
        this.router.navigate(['/listas', lista.id]);
      },
      error: (err) => this.toastr.error(err.error?.data?.nombre?.[0] ?? 'No se pudo crear la lista')
    });
  }
}
