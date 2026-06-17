import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-espacio-detalle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './espacio-detalle.html',
  styleUrls: ['./espacio-detalle.css'],
})
export class EspacioDetalleComponent implements OnInit {
  private route = inject(ActivatedRoute);
  idEspacio: number | null = null;

  ngOnInit(): void {
    const param = this.route.snapshot.paramMap.get('id');
    this.idEspacio = param ? Number(param) : null;
  }
}
