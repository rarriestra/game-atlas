import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { Lista } from '../../models/lista.model';
import { Videojuego } from '../../models/videojuego.model';
import { ListaService } from '../../services/lista-service';
import { SesionService } from '../../services/sesion-service';
import { VideojuegoService } from '../../services/videojuego-service';

@Component({
  selector: 'app-lista-detalle',
  imports: [FormsModule, RouterLink],
  templateUrl: './lista-detalle.html',
  styleUrl: './lista-detalle.css'
})
export class ListaDetalle implements OnInit {
  lista?: Lista;
  mensaje = '';
  editando = false;        // CU10: modo edición de nombre y descripción
  nombre = '';
  descripcion = '';
  busqueda = '';           // CU10: buscador para agregar juegos
  resultados: Videojuego[] = [];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly listaService: ListaService,
    private readonly videojuegoService: VideojuegoService,
    private readonly toastr: ToastrService,
    readonly sesion: SesionService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.listaService.get(id).subscribe({
      next: (data) => this.lista = data,
      error: () => this.mensaje = 'La lista no existe.'
    });
  }

  // Getter: se recalcula solo si cambian el usuario de la navbar
  get esDueno(): boolean {
    return !!this.lista && this.lista.usuario === this.sesion.usuarioActual?.id;
  }

  // CU10: editar nombre y descripción
  editar(): void {
    if (!this.lista) return;
    this.nombre = this.lista.nombre;           // se copian, así "Cancelar" no deja cambios a medias
    this.descripcion = this.lista.descripcion;
    this.editando = true;
  }

  guardar(): void {
    if (!this.lista) return;
    this.listaService.editar(this.lista.id, { nombre: this.nombre.trim(), descripcion: this.descripcion.trim() })
      .subscribe({
        next: (data) => {
          this.lista = data;
          this.editando = false;
          this.toastr.success('Lista actualizada');
        },
        error: (err) => this.toastr.error(err.error?.data?.nombre?.[0] ?? 'No se pudo guardar')
      });
  }

  // CU11: eliminar con confirmación y volver al perfil
  eliminar(): void {
    const lista = this.lista;
    if (!lista) return;
    Swal.fire({
      title: `¿Eliminar "${lista.nombre}"?`,
      text: 'Los juegos no se borran del catálogo ni de tu biblioteca.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545'
    }).then((resultado) => {
      if (!resultado.isConfirmed) return;
      this.listaService.eliminar(lista.id).subscribe({
        next: () => {
          this.toastr.success('Lista eliminada');
          this.router.navigate(['/usuarios', lista.usuario]);
        },
        error: () => this.toastr.error('No se pudo eliminar')
      });
    });
  }

  // CU10: buscar juegos para agregar. Reusa la búsqueda del catálogo (que importa de IGDB si hace falta)
  buscar(): void {
    const titulo = this.busqueda.trim();
    if (!titulo) return;
    this.videojuegoService.getPagina(1, titulo).subscribe(pagina => this.resultados = pagina.data);
  }

  contiene(videojuegoId: number): boolean {
    return !!this.lista?.videojuegos.some(v => v.id === videojuegoId);
  }

  // CU10: agregar o quitar un juego (el mismo endpoint hace las dos cosas)
  alternar(juego: { id?: number; titulo: string; portada_url: string }): void {
    const lista = this.lista;
    if (!lista || !juego.id) return;
    const id = juego.id;
    this.listaService.toggleJuego(lista.id, id).subscribe({
      next: (res) => {
        lista.videojuegos = res.en_lista
          ? [...lista.videojuegos, { id, titulo: juego.titulo, portada_url: juego.portada_url }]
          : lista.videojuegos.filter(v => v.id !== id);
      },
      error: () => this.toastr.error('No se pudo actualizar la lista')
    });
  }
}
