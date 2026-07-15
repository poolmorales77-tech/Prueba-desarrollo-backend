import { Component, NgZone, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DataService } from '../services/data';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-detalle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detalle.component.html'
})
export class DetalleComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private dataService = inject(DataService);
  private ngZone = inject(NgZone);

  item: any;
  padres: any[] = [];
  loading = true;
  errorMessage = '';

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.loading = true;
      this.errorMessage = '';

      this.dataService.getVinculos(id).subscribe({
        next: (data: any) => {
          console.log('getVinculos response:', data);
          this.ngZone.run(() => {
            this.item = data;
            this.padres = this.normalizarPadres(data);
            this.loading = false;
          });
        },
        error: (err) => {
          console.error('Error en getVinculos:', err);
          this.ngZone.run(() => {
            this.errorMessage = err.message || 'Error al cargar los datos';
            this.loading = false;
          });
        }
      });
    } else {
      this.loading = false;
      this.errorMessage = 'No se recibió childId en la URL.';
    }
  }

  private normalizarPadres(data: any): any[] {
    const posiblesPadres = [
      data?.padres,
      data?.parents,
      data?.result?.padres,
      data?.result?.parents
    ];

    const fuente = posiblesPadres.find((valor) => Array.isArray(valor));

    if (!fuente) {
      return [];
    }

    return fuente.map((padre: any) => ({
      _id: padre?._id ?? padre?.id ?? padre?.parentId ?? '',
      name: padre?.name ?? padre?.fullName ?? 'Sin nombre',
      email: padre?.email ?? 'No disponible',
      role: padre?.role ?? 'persona'
    }));
  }
}