import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { ApiService } from '../services/api';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './card.html',
  styleUrl: './card.scss'
})
export class CardComponent {
  Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });
  @Input() item: any;
  private api = inject(ApiService);
  private router = inject(Router);

  addToCart(product: any) {
  console.log('Product object:', product); 
  
  if (!product || (!product._id && !product.id)) {
      console.error('პროდუქტის ობიექტი ან _id არასწორია:', product);
      return;
  }

  // მარაგის შემოწმება
  if (product.stock <= 0) {
    this.Toast.fire({
      icon: 'warning',
      title: 'პროდუქტი არ არის მარაგში!'
    });
    return;
  }

  // ავტორიზაციის შემოწმება
  if (!this.api.isAuthenticated()) {
    this.Toast.fire({
      icon: 'info',
      title: 'გთხოვთ, ჯერ შეხვიდეთ სისტემაში!'
    });
    this.router.navigate(['/']); 
    return;
  }

  console.log('ვამატებ პროდუქტს ID-ით:', product._id);

  this.api.addToCart(product._id, 1).subscribe({
    next: (res) => {
      console.log('სერვერმა დაადასტურა დამატება:', res);
      
      this.Toast.fire({
        icon: 'success',
        title: 'წარმატებით დაემატა! 🎉'
      });
      
      this.api.updateCartCount();
    },
    error: (err) => {
     
      if (err.status === 400 && err.error?.errorKeys?.includes('errors.user_already_has_cart')) {
       
        
        this.api.patchCart(product._id, 1).subscribe({
          next: (res) => {
            this.Toast.fire({
              icon: 'success',
              title: 'კალათა განახლდა! 🛒'
            });
            this.api.updateCartCount();
          },
          error: (patchErr) => {
            console.error('PATCH-იც დაფეილდა:', patchErr);
            this.Toast.fire({
              icon: 'error',
              title: 'ვერ მოხერხდა კალათის განახლება'
            });
          }
        });

      } else {
        console.error('სხვა შეცდომა:', err);
        this.Toast.fire({
          icon: 'error',
          title: 'შეცდომა დამატებისას!'
        });
      }
    }
  });
}
}