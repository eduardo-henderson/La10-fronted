import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { PromoPackService } from '../../service/promo-pack.service';
import { PromoPack } from '../../models/promo-pack.model';

interface FormPack {
  idPp: number | null;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  estado: string;
}

@Component({
  selector: 'app-promos-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './promos-admin.html',
  styleUrls: ['./promos-admin.css'],
})
export class PromosAdminComponent implements OnInit {
  private servicio = inject(PromoPackService);
  private cdr = inject(ChangeDetectorRef);

  packs: PromoPack[] = [];
  cargando = false;
  mensajeError = '';
  filtro = '';

  pagina = 0;
  tamanio = 8;

  modalAbierto = false;
  modoEdicion = false;
  guardando = false;
  errorModal = '';
  form: FormPack = this.formVacio();

  modalBorrarAbierto = false;
  borrando = false;
  packABorrar: PromoPack | null = null;

  aviso = '';

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.mensajeError = '';
    this.servicio.listarTodos().subscribe({
      next: (lista) => {
        this.packs = lista ?? [];
        if (this.pagina > 0 && this.pagina >= this.totalPaginas) {
          this.pagina = this.totalPaginas - 1;
        }
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cargando = false;
        this.mensajeError =
          err?.status === 401 || err?.status === 403
            ? 'Tu sesión expiró o no tenés permisos para ver los productos.'
            : 'No se pudieron cargar los productos. Verificá que el backend esté corriendo.';
        this.cdr.detectChanges();
      },
    });
  }

  // Lista filtrada
  get packsFiltrados(): PromoPack[] {
    const q = this.filtro.trim().toLowerCase();
    const base = !q
      ? this.packs
      : this.packs.filter((p) =>
          [p.nombre, p.descripcion].filter(Boolean).some((c) => c.toLowerCase().includes(q)),
        );

    return [...base].sort((a, b) =>
      a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }),
    );
  }

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.packsFiltrados.length / this.tamanio));
  }

  get packsPagina(): PromoPack[] {
    const inicio = this.pagina * this.tamanio;
    return this.packsFiltrados.slice(inicio, inicio + this.tamanio);
  }

  get numerosPagina(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, i) => i);
  }

  get esPrimera(): boolean {
    return this.pagina === 0;
  }
  get esUltima(): boolean {
    return this.pagina >= this.totalPaginas - 1;
  }

  onBuscar(): void {
    this.pagina = 0; // resetear al filtrar
  }

  paginaSiguiente(): void {
    if (!this.esUltima) this.pagina++;
  }
  paginaAnterior(): void {
    if (!this.esPrimera) this.pagina--;
  }
  irAPagina(n: number): void {
    if (n >= 0 && n < this.totalPaginas) this.pagina = n;
  }

  // Modal crear/editar
  abrirCrear(): void {
    this.modoEdicion = false;
    this.form = this.formVacio();
    this.errorModal = '';
    this.modalAbierto = true;
  }

  abrirEditar(p: PromoPack): void {
    this.modoEdicion = true;
    this.errorModal = '';
    this.form = {
      idPp: p.idPp,
      nombre: p.nombre ?? '',
      descripcion: p.descripcion ?? '',
      precio: p.precio ?? 0,
      stock: p.stock ?? 0,
      estado: p.estado ?? 'A',
    };
    this.modalAbierto = true;
  }

  cerrarModal(): void {
    if (this.guardando) return;
    this.modalAbierto = false;
    this.errorModal = '';
  }

  guardar(formRef: NgForm): void {
    if (formRef.invalid || this.guardando) {
      formRef.form.markAllAsTouched();
      this.errorModal = 'Completá los campos obligatorios.';
      return;
    }
    if (this.form.precio < 0 || this.form.stock < 0) {
      this.errorModal = 'Precio y stock no pueden ser negativos.';
      return;
    }

    this.guardando = true;
    this.errorModal = '';

    const payload: PromoPack = {
      idPp: this.form.idPp ?? 0,
      nombre: this.form.nombre,
      descripcion: this.form.descripcion,
      precio: this.form.precio,
      stock: this.form.stock,
      estado: this.form.estado,
    };

    const req$ = this.modoEdicion
      ? this.servicio.actualizar(payload)
      : this.servicio.crear(payload);

    req$.subscribe({
      next: () => {
        this.guardando = false;
        this.modalAbierto = false;
        this.mostrarAviso(this.modoEdicion ? 'Producto actualizado.' : 'Producto creado.');
        this.cargar();
      },
      error: (err) => {
        this.guardando = false;
        this.errorModal = this.textoError(err, 'No se pudo guardar el producto.');
        this.cdr.detectChanges();
      },
    });
  }

  // Modal desactivar
  abrirBorrar(p: PromoPack): void {
    this.packABorrar = p;
    this.modalBorrarAbierto = true;
  }

  cerrarBorrar(): void {
    if (this.borrando) return;
    this.modalBorrarAbierto = false;
    this.packABorrar = null;
  }

  confirmarBorrar(): void {
    if (!this.packABorrar || this.borrando) return;
    this.borrando = true;
    this.servicio.eliminar(this.packABorrar.idPp).subscribe({
      next: () => {
        this.borrando = false;
        this.modalBorrarAbierto = false;
        this.packABorrar = null;
        this.mostrarAviso('Producto desactivado.');
        this.cargar();
      },
      error: (err) => {
        this.borrando = false;
        this.modalBorrarAbierto = false;
        this.packABorrar = null;
        this.mensajeError = this.textoError(err, 'No se pudo desactivar el producto.');
        this.cdr.detectChanges();
      },
    });
  }

  // Reactivar
  reactivar(p: PromoPack): void {
    const payload: PromoPack = { ...p, estado: 'A' };
    this.servicio.actualizar(payload).subscribe({
      next: () => {
        this.mostrarAviso('Producto reactivado.');
        this.cargar();
      },
      error: (err) => {
        this.mensajeError = this.textoError(err, 'No se pudo reactivar el producto.');
        this.cdr.detectChanges();
      },
    });
  }

  esActivo(p: PromoPack): boolean {
    return (p.estado || '').toUpperCase() === 'A';
  }

  private formVacio(): FormPack {
    return { idPp: null, nombre: '', descripcion: '', precio: 0, stock: 0, estado: 'A' };
  }

  private textoError(err: any, fallback: string): string {
    if (err?.status === 401 || err?.status === 403) {
      return 'No tenés permisos para esta acción o tu sesión expiró.';
    }
    return err?.error?.message || err?.message || fallback;
  }

  private mostrarAviso(texto: string): void {
    this.aviso = texto;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.aviso = '';
      this.cdr.detectChanges();
    }, 3000);
  }

  trackById(_i: number, p: PromoPack): number {
    return p.idPp;
  }
}
