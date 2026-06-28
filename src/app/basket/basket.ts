import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../services/api';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-basket',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './basket.html',
  styleUrl: './basket.scss',
})


export class Basket implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true
    });
  
  cartItems: any[] = [];
  totalPrice: number = 0;
  cartCount: number = 0;

  ngOnInit() {
    this.loadCart();
  }

  loadCart() {
  this.api.getCart().subscribe({
    next: (res: any) => {
      console.log('Cart response:', res);
      
      //სუფთა მონაცემები სერვერიდან
      const productsFromApi = res.products || []; 

      //  (Enrich)
      
      this.cartItems = productsFromApi.map((item: any) => {
        const product = this.api.allProducts().find(p => p._id === item.productId);
        
        return {
          ...item,
          // თუ პროდუქტი იპოვა - ჩასვამს, თუ არა - შექმნის default ობიექტს
          product: product || { 
            title: 'Unknown Product', 
            price: { current: 0 }, 
            image: '', 
            category: { name: 'Unknown' } 
          }
        };
      });

      this.cartCount = this.cartItems.length;
      this.calculateTotal();
      console.log('კალათა წარმატებით შეივსო:', this.cartItems);
    },
    error: (err) => {
      if (err.status === 409 || err.status === 404) {
        console.warn('კალათა ცარიელია');
        this.cartItems = [];
        this.totalPrice = 0;
        this.cartCount = 0;
      } else {
        console.error('კალათის ჩატვირთვის შეცდომა:', err);
      }
    }
  });
}



  goToAllProducts(){
    this.router.navigate(['/allProducts']);
  }

  calculateTotal() {
    this.totalPrice = this.cartItems.reduce((acc, item) => {
      const price = item.product?.price?.current || item.product?.price || item.price?.current || item.price || item.pricePerQuantity || 0;
      const quantity = item.quantity || 1;
      return acc + (price * quantity);
    }, 0);
  }



  removeItem(id: string) {
  console.log('Attempting to remove item with Entry ID:', id);
  
  this.api.removeFromCart(id).subscribe({
    next: (res) => {
      
      this.Toast.fire({
        icon: 'success',
        title: 'პროდუქტი კალათიდან წაშლილია'
      });
      
      this.loadCart(); // კალათის თავიდან ჩატვირთვა
    },
    error: (err) => {
      console.error('წაშლის ერორი:', err);
      
      
      if (err === 'User not authenticated') {
        this.Toast.fire({
          icon: 'warning',
          title: 'გთხოვთ, ჯერ შეხვიდეთ სისტემაში!'
        });
      } else {
        this.Toast.fire({
          icon: 'error',
          title: 'ერორი წაშლისას'
        });
      }
    }
  });
}

  changeQuantity(item: any, change: number) {
  // ID-ის ამოღება
  const id = item.productId;
  const newQuantity = item.quantity + change;
  if (newQuantity <= 0) {
    this.removeItem(id);
    return;
  }

  if (!id) {
    console.error('პროდუქტის ID ვერ მოიძებნა!', item);
    return;
  }

  // 2. წაშლის ლოგიკა 
  if (change === -1 && item.quantity <= 1) {
    
    this.removeItem(id); 
    return;
  }

  //  სერვისის გამოძახება
  this.api.updateCartQuantity(id, newQuantity).subscribe({
    next: (res) => {
      console.log('რაოდენობა განახლდა წარმატებით');
      
      // აუცილებელია ორივე:
      this.loadCart();          // 1. კალათის სიის განახლება (ეკრანისთვის)
      this.api.updateCartCount(); // 2. ჰედერის ციფრის განახლება
    },
    error: (err) => {
      console.error('შეცდომა განახლებისას:', err);
      
      if (err.status === 400) {
        alert('ოპერაცია ვერ შესრულდა. შესაძლოა პროდუქტი ამოიწურა.');
      }
    }
  });
}

  clearCart() {
  // Confirm-ის ნაცვლად ვიყენებთ Swal.fire-ს (დიდი ფანჯარა)
  Swal.fire({
    title: 'დარწმუნებული ხართ?',
    text: "კალათა მთლიანად გასუფთავდება!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'დიახ, გასუფთავება!',
    cancelButtonText: 'გაუქმება'
  }).then((result) => {
    // თუ მომხმარებელმა დააჭირა "დიახ"
    if (result.isConfirmed) {
      this.api.clearCart().subscribe({
        next: (res) => {
          console.log('კალათა გასუფთავებულია:', res);
          this.loadCart();
          
          // პატარა Toast შეტყობინება წარმატებაზე
          this.Toast.fire({
            icon: 'success',
            title: 'კალათა წარმატებით გასუფთავდა!'
          });
        },
        error: (err) => {
          console.error('კალათის გასუფთავების ერორი:', err);
          
          this.Toast.fire({
            icon: 'error',
            title: 'შეცდომა გასუფთავებისას'
          });
          this.loadCart(); // მაინც გადავტვირთოთ
        }
      });
    }
  });
}
}