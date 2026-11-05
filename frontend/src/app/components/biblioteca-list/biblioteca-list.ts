import { Component, DoCheck, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { BibliotecaItem, ESTADOS, ESTADOS_CALIFICABLES, Estado } from '../../models/biblioteca-item.model';
import { Genero } from '../../models/genero.model';
import { Idioma } from '../../models/idioma.model';
import { DireccionOrden, Orden } from '../../models/videojuego.model';
import { BibliotecaService } from '../../services/biblioteca-service';
import { GeneroService } from '../../services/genero-service';
import { IdiomaService } from '../../services/idioma-service';
import { SesionService } from '../../services/sesion-service';

// Por qué se puede ordenar. direccion = con cuál arranca al elegirlo
const CAMPOS_ORDEN: { valor: string; texto: string; direccion: DireccionOrden }[] = [
  { valor: 'titulo', texto: 'Nombre', direccion: 'asc' },
  { valor: 'promedio', texto: 'Puntaje general', direccion: 'desc' },
  { valor: 'mi_puntaje', texto: 'Mi puntaje', direccion: 'desc' },
  { valor: 'estado', texto: 'Estado', direccion: 'asc' },
];

@Component({
  selector: 'app-biblioteca-list',
  imports: [FormsModule, RouterLink, DecimalPipe],
  templateUrl: './biblioteca-list.html',
  styleUrl: './biblioteca-list.css'
})
export class BibliotecaList implements OnInit, DoCheck {
  items: BibliotecaItem[] = [];               // la biblioteca del usuario, con los filtros aplicados
  filtro?: Estado;                            // pestaña elegida; undefined = Todos
  readonly estados = ESTADOS;
  readonly puntajes = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
  private usuarioCargado: number | undefined | null = null;

  // Filtros: los mismos que el catálogo
  busqueda = '';
  generos: Genero[] = [];
  generoFiltro?: number;
  idiomas: Idioma[] = [];
  idiomaFiltro?: number;

  // Panel de orden: lo que se está eligiendo. Recién cuenta al tocar Aplicar
  panelOrden = false;
  readonly camposOrden = CAMPOS_ORDEN;
  primario = '';                            // '' = sin elegir
  dirPrimario: DireccionOrden = 'asc';
  secundario = '';
  dirSecundario: DireccionOrden = 'asc';
  ordenAplicado: Orden[] = [];              // lo que se le pide a Django

  constructor(
    private readonly bibliotecaService: BibliotecaService,
    private readonly generoService: GeneroService,
    private readonly idiomaService: IdiomaService,
    private readonly toastr: ToastrService,
    readonly sesion: SesionService
  ) {}

  ngOnInit(): void {
    this.generoService.getAll().subscribe(data => this.generos = data);
    this.idiomaService.getAll().subscribe(data => this.idiomas = data);
  }

  // Igual que en el panel: si cambian el usuario en la navbar, recarga
  ngDoCheck(): void {
    const usuarioId = this.sesion.usuarioActual?.id;
    if (usuarioId !== this.usuarioCargado) {
      this.usuarioCargado = usuarioId;
      this.cargar();
    }
  }

  cargar(): void {
    this.items = [];
    const usuarioId = this.sesion.usuarioActual?.id;
    if (!usuarioId) return;
    this.bibliotecaService.getFiltrada(usuarioId, this.busqueda, this.generoFiltro, this.idiomaFiltro, this.ordenAplicado).subscribe({
      next: (data) => this.items = data,
      error: () => this.toastr.error('No se pudo cargar la biblioteca')
    });
  }

  limpiar(): void {
    this.busqueda = '';
    this.generoFiltro = undefined;
    this.idiomaFiltro = undefined;
    this.cargar();
  }

  // ---------- Orden ----------

  // Las opciones del secundario: las mismas, menos la que ya se eligió como principal
  get camposSecundarios() {
    return CAMPOS_ORDEN.filter(c => c.valor !== this.primario);
  }

  // El texto del botón, por ejemplo "Mi puntaje ↓, Nombre ↑"
  get resumenOrden(): string {
    if (!this.ordenAplicado.length) return 'Últimos actualizados';
    return this.ordenAplicado
      .map(o => `${CAMPOS_ORDEN.find(c => c.valor === o.campo)?.texto} ${o.direccion === 'asc' ? '↑' : '↓'}`)
      .join(', ');
  }

  private direccionInicial(campo: string): DireccionOrden {
    return CAMPOS_ORDEN.find(c => c.valor === campo)?.direccion ?? 'asc';
  }

  cambiarPrimario(campo: string): void {
    this.primario = campo;
    this.dirPrimario = this.direccionInicial(campo);
    // Sin principal no hay secundario, y los dos no pueden ser el mismo
    if (!campo || this.secundario === campo) this.secundario = '';
  }

  cambiarSecundario(campo: string): void {
    this.secundario = campo;
    this.dirSecundario = this.direccionInicial(campo);
  }

  // Pasa lo elegido a ordenAplicado y vuelve a pedir la lista
  aplicarOrden(): void {
    this.ordenAplicado = [];
    if (this.primario) this.ordenAplicado.push({ campo: this.primario, direccion: this.dirPrimario });
    if (this.secundario) this.ordenAplicado.push({ campo: this.secundario, direccion: this.dirSecundario });
    this.panelOrden = false;
    this.cargar();
  }

  limpiarOrden(): void {
    this.primario = '';
    this.secundario = '';
    this.aplicarOrden();
  }

  // Los items de la pestaña elegida
  get itemsFiltrados(): BibliotecaItem[] {
    return this.filtro ? this.items.filter(i => i.estado === this.filtro) : this.items;
  }

  // Para el número al lado de cada pestaña
  cantidad(estado?: Estado): number {
    return estado ? this.items.filter(i => i.estado === estado).length : this.items.length;
  }

  puedeCalificar(item: BibliotecaItem): boolean {
    return ESTADOS_CALIFICABLES.includes(item.estado);
  }

  // Modificación desde la tabla: estado o puntaje
  actualizar(item: BibliotecaItem, cambios: { estado?: Estado; puntaje?: number | null }): void {
    this.bibliotecaService.actualizar(item.id, cambios).subscribe({
      next: (actualizado) => {
        // reemplaza el item viejo por el que devolvió Django (así la tabla muestra lo mismo que la base)
        this.items = this.items.map(i => i.id === actualizado.id ? actualizado : i);
      },
      error: () => this.toastr.error('No se pudo guardar el cambio')
    });
  }

  // Baja con confirmación
  quitar(item: BibliotecaItem): void {
    Swal.fire({
      title: '¿Quitar de tu biblioteca?',
      text: `Se va a quitar "${item.videojuego.titulo}".`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Quitar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545'
    }).then((resultado) => {
      if (!resultado.isConfirmed) return;
      this.bibliotecaService.quitar(item.id).subscribe({
        next: () => {
          this.items = this.items.filter(i => i.id !== item.id);
          this.toastr.success('Quitado de tu biblioteca');
        },
        error: () => this.toastr.error('No se pudo quitar')
      });
    });
  }
}
