import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { catchError, finalize, forkJoin, map, of } from 'rxjs';
import Swal from 'sweetalert2';
import { Plataforma } from '../../models/plataforma.model';
import { PlataformaService } from '../../services/plataforma-service';

@Component({
  selector: 'app-plataforma-list',
  imports: [FormsModule, NgClass],
  templateUrl: './plataforma-list.html',
  styleUrl: './plataforma-list.css'
})
export class PlataformaList implements OnInit {
  plataformas: Plataforma[] = [];
  plataforma = new Plataforma();
  editandoId?: number;
  nombreEditado = '';
  guardando = false;
  eliminando = false;
  seleccionados = new Set<number>();
  mensaje = '';

  @ViewChild('campoEdicion') set campoEdicion(campo: ElementRef<HTMLInputElement> | undefined) {
    campo?.nativeElement.focus();
  }

  constructor(
    private readonly plataformaService: PlataformaService,
    private readonly toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.plataformaService.getAll().subscribe({
      next: (data) => {
        this.plataformas = data;
        this.mensaje = '';
      },
      error: () => this.mensaje = 'No se pudo conectar con el servidor.'
    });
  }

  agregar(): void {
    const nombre = this.plataforma.nombre.trim();
    if (!nombre || this.guardando) return;
    this.guardando = true;
    this.plataformaService.create({ nombre })
      .pipe(finalize(() => this.guardando = false))
      .subscribe({
        next: () => {
          this.toastr.success('Plataforma creada');
          this.plataforma = new Plataforma();
          this.cargar();
        },
        error: () => this.toastr.error('No se pudo guardar')
      });
  }

  editar(plataforma: Plataforma): void {
    this.editandoId = plataforma.id;
    this.nombreEditado = plataforma.nombre;
  }

  cancelar(): void {
    this.editandoId = undefined;
    this.nombreEditado = '';
  }

  guardarEdicion(): void {
    const nombre = this.nombreEditado.trim();
    if (!nombre || !this.editandoId || this.guardando) return;
    this.guardando = true;
    this.plataformaService.update(this.editandoId, { nombre })
      .pipe(finalize(() => this.guardando = false))
      .subscribe({
        next: () => {
          this.toastr.success('Plataforma modificada');
          this.cancelar();
          this.cargar();
        },
        error: () => this.toastr.error('No se pudo guardar')
      });
  }

  alternarSeleccion(id: number): void {
    if (this.seleccionados.has(id)) {
      this.seleccionados.delete(id);
    } else {
      this.seleccionados.add(id);
    }
  }

  get todosSeleccionados(): boolean {
    return this.plataformas.length > 0 && this.seleccionados.size === this.plataformas.length;
  }

  alternarTodos(): void {
    this.seleccionados = this.todosSeleccionados
      ? new Set()
      : new Set(this.plataformas.map(p => p.id!));
  }

  eliminar(plataforma: Plataforma): void {
    Swal.fire({
      title: '¿Eliminar plataforma?',
      text: `Se va a borrar "${plataforma.nombre}" y se va a sacar de los videojuegos que la tengan.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545'
    }).then((resultado) => {
      if (!resultado.isConfirmed || !plataforma.id) return;
      const id = plataforma.id;
      this.plataformaService.delete(id).subscribe({
        next: () => {
          this.toastr.success('Plataforma eliminada');
          if (this.editandoId === id) this.cancelar();
          this.seleccionados.delete(id);
          this.cargar();
        },
        error: () => this.toastr.error('No se pudo eliminar')
      });
    });
  }

  eliminarSeleccionados(): void {
    const ids = [...this.seleccionados];
    const nombres = this.plataformas.filter(p => this.seleccionados.has(p.id!)).map(p => p.nombre).join(', ');
    Swal.fire({
      title: '¿Eliminar las plataformas seleccionadas?',
      text: `Se va a borrar: ${nombres}. También se van a sacar de los videojuegos que las tengan.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545'
    }).then((resultado) => {
      if (!resultado.isConfirmed || this.eliminando) return;
      this.eliminando = true;
      forkJoin(ids.map(id => this.plataformaService.delete(id).pipe(
        map(() => true),
        catchError(() => of(false))
      ))).subscribe(resultados => {
        const fallaron = ids.filter((_, i) => !resultados[i]);
        const eliminadas = ids.length - fallaron.length;
        if (eliminadas) this.toastr.success(`Plataformas eliminadas: ${eliminadas}`);
        if (fallaron.length) this.toastr.error(`No se pudieron eliminar: ${fallaron.length}`);
        if (this.editandoId && ids.includes(this.editandoId) && !fallaron.includes(this.editandoId)) this.cancelar();
        this.seleccionados = new Set(fallaron);
        this.eliminando = false;
        this.cargar();
      });
    });
  }
}
