import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2'; // librería para mostrar alertas estilizadas
import { Genero } from '../../models/genero.model';
import { Videojuego } from '../../models/videojuego.model';
import { VideojuegoService } from '../../services/videojuego-service';
import { GeneroService } from '../../services/genero-service';
@Component({
  selector: 'app-videojuego-list',
  imports: [RouterLink, FormsModule],
  templateUrl: './videojuego-list.html',
  styleUrl: './videojuego-list.css'
})
export class VideojuegoList implements OnInit {
  videojuegos: Videojuego[] = [];
  generos: Genero[] = [];
  busqueda = '';
  generoFiltro?: number;
  mensaje = '';

  constructor(private readonly videojuegoService: VideojuegoService, private readonly generoService: GeneroService, private readonly toastr: ToastrService) {}

  ngOnInit(): void {
    this.generoService.getAll().subscribe(data => this.generos = data);
    this.cargar();
  }

  cargar(): void {
    this.videojuegoService.getAll(this.busqueda,this.generoFiltro).subscribe({
      next: (data) => this.videojuegos = data,
      error: () => this.mensaje = 'No se pudo conectar con el servidor.'
    });
  }
  limpiar(): void {
    this.busqueda = '';
    this.generoFiltro = undefined; // undefined indica que no hay ningún género seleccionado
    this.cargar(); 
  }
  nombres(lista: { nombre: string }[]): string {
    return lista.map(item => item.nombre).join(', '); // map() crea un nuevo array con los nombres de los géneros y join() los une en un string separados por comas
  }

  
  eliminar(videojuego: Videojuego): void {
    Swal.fire({
      title: '¿Eliminar este videojuego?',
      text: `Se va a borrar "${videojuego.titulo}". Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545', // rojo
    }).then((result) => {
      if (!result.isConfirmed || !videojuego.id) {
        return;
      }
      this.videojuegoService.delete(videojuego.id).subscribe({
        next: () => {
          this.toastr.success('Videojuego eliminado correctamente.');
          this.cargar(); // recarga la lista de videojuegos después de eliminar
        },
          error: () => this.toastr.error('No se pudo eliminar el videojuego.')
        });
      });
    }
 }
 