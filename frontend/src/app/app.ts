import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Usuario } from './models/usuario.model';
import { UsuarioService } from './services/usuario-service';
import { SesionService } from './services/sesion-service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, FormsModule],   // NUEVO: FormsModule para el select
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  usuarios: Usuario[] = [];   // opciones del desplegable

  constructor(
    private readonly usuarioService: UsuarioService,
    private readonly router: Router,
    readonly sesion: SesionService   // sin private: el html lo usa para mostrar el elegido
  ) {}

  ngOnInit(): void {
    this.usuarioService.getAll().subscribe(data => {
      this.usuarios = data;
      // Si el usuario guardado ya no existe (lo borraron en /admin), se limpia
      const actual = this.sesion.usuarioActual;
      if (actual) {
        // Lo reemplaza por la versión recién traída (o lo limpia si ya no existe)
        this.sesion.elegir(data.find(u => u.id === actual.id));
      }
    });
  }

  // Se ejecuta cuando cambia el desplegable: recibe el id elegido y busca el usuario completo
  cambiarUsuario(id: number | null): void {
    this.sesion.elegir(this.usuarios.find(u => u.id === id));
    // Si ya no es admin y está en una pantalla de admin, vuelve al catálogo
    const pantallaAdmin = ['/generos', '/plataformas', '/videojuegos/nuevo'].some(r => this.router.url.startsWith(r));
    if (!this.sesion.esAdmin && pantallaAdmin) {
      this.router.navigate(['/videojuegos']);
    }
  }
}