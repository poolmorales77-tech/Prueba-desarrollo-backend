import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private http = inject(HttpClient); 
  private apiUrl = 'http://localhost:3000/api'; // Asegúrate que esta sea tu URL base

  // Método que ya tenías
  getItemById(id: string | number) {
    return this.http.get(`${this.apiUrl}/items/${id}`);
  }

  // Método para obtener vínculos usando query params
  getVinculos(childId: string | number) {
    const params = new HttpParams().set('childId', String(childId));
    return this.http.get(`${this.apiUrl}/vinculos`, { params });
  }
}