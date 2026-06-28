
import 'zone.js';
import { Component, OnInit, inject, computed } from '@angular/core';
import { ApiService } from '../services/api';
import { CardComponent } from '../card/card';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';




@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CardComponent, CommonModule, RouterLink],
  templateUrl: './main.html',
  styleUrls: ['./main.scss'],
})
export class MainComponent implements OnInit {
  public api = inject(ApiService);

 
  bestSellers = computed(() => {
    
    const products = this.api.allProducts(); 
    
    return [...products]
      .sort((a, b) => {
        const rateA = a.rating?.rate || a.rating || 0;
        const rateB = b.rating?.rate || b.rating || 0;
        return rateB - rateA; // მაღალი რეიტინგი პირველზე
      })
      .slice(0, 8); // მხოლოდ პირველი რვა
  });

  ngOnInit() {
    this.api.fetchCards();
  }
} 
