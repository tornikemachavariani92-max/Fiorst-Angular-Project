import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ApiService } from '../services/api';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-details.html',
  styleUrls: ['./product-details.scss']
})
export class ProductDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private api = inject(ApiService);
  Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });

  product: any = null;
  mainImage: string = '';
  loading = true;
  error = false;

  ngOnInit() {
    const productId = this.route.snapshot.paramMap.get('id');
    if (productId) {
      this.fetchProductDetails(productId);
    } else {
      this.error = true;
      this.loading = false;
    }
  }

  fetchProductDetails(id: string) {
    const url = `https://api.everrest.educata.dev/shop/products/id/${id}`;

    this.http.get<any>(url).subscribe({
      next: (product) => {
        this.product = product;
        this.mainImage = product.thumbnail;
        this.loading = false;
      },
      error: (err) => {
        console.error('შეცდომა:', err);
        this.error = true;
        this.loading = false;
      }
    });
  }

  changeMainImage(imageUrl: string) {
    this.mainImage = imageUrl;
  }

  addToCart() {
  if (this.product) {
    this.api.addToCart(this.product._id, 1).subscribe({
      next: (res) => {
        console.log('პროდუქტი დაემატა:', res);
        
       
        this.Toast.fire({
          icon: 'success',
          title: 'პროდუქტი დაემატა კალათაში! 🛒'
        });

        this.api.updateCartCount();
      },
      error: (err) => {
        console.error('კალათაში დამატების ერორი:', err);
        
       
        if (err === 'User not authenticated') {
          this.Toast.fire({
            icon: 'info',
            title: 'გთხოვთ, ჯერ შეხვიდეთ სისტემაში!'
          });
        } else {
          this.Toast.fire({
            icon: 'error',
            title: 'შეცდომა კალათაში დამატებისას'
          });
        }
      }
    });
  }
}

  goBack() {
    this.router.navigate(['/allProducts']);
  }
}