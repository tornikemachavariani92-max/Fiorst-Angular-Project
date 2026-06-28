import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable,} from 'rxjs';
import { switchMap, catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);

  // აქ შეინახება ყველა (38-ვე) პროდუქტი ძებნისთვის
  public allProducts = signal<any[]>([]);

  // აქ შეინახება მხოლოდ ის პროდუქტები, რომელიც ეკრანზე უნდა გამოჩნდეს
  public displayCards = signal<any[]>([]);

  public cartCount = signal(0);
  public cartItems = signal<any[]>([]);
  currentUser = signal<any>(null);

  private cartApiUrl = 'https://api.everrest.educata.dev/shop/cart';
  private addToCartUrl = 'https://api.everrest.educata.dev/shop/cart/product';

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    console.log('Auth token from localStorage:', token);
    if (!token) {
      console.warn('No auth token found in localStorage');
    }
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  patchCart(productId: string, quantity: number) {
  return this.http.patch('https://api.everrest.educata.dev/shop/cart/product', {
    productId: productId,
    quantity: quantity
  });
}

  getCategories(): Observable<any[]> {
  return this.http.get<any[]>('https://api.everrest.educata.dev/shop/products/categories');
}


// ბრენდების წამოღება
getBrands(): Observable<string[]> {
  return this.http.get<string[]>('https://api.everrest.educata.dev/shop/products/brands');
}


// პროდუქტის შეფასება (Rating)
rateProduct(productId: string, rate: number): Observable<any> {
  const url = 'https://api.everrest.educata.dev/shop/products/rate';
  return this.http.post(url, { productId, rate }, { headers: this.getAuthHeaders() });
}

updateCartQuantity(productId: string, qty: number) {
  const token = localStorage.getItem('auth_token'); 
  
  const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

  
  const body = {
    id: productId,
    quantity: qty
  };

  // ვიყენებთ PATCH მეთოდს 
  return this.http.patch('https://api.everrest.educata.dev/shop/cart/product', body, { headers });
}


  fetchCards() {
    const url = 'https://api.everrest.educata.dev/shop/products/all?page_index=1&page_size=38';

    this.http.get<any>(url).subscribe({
      next: (res) => {
        console.log('მონაცემები მოვიდა:', res);
        this.allProducts.set(res.products);
        this.displayCards.set(res.products);
      },
      error: (err) => {
        console.error('API ერორი:', err);
      }
    });
  }

  // კალათის მიღება API-დან
  getCart(): Observable<any> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      
      return new Observable(subscriber => {
        subscriber.next({ products: [], items: [] });
        subscriber.complete();
      });
    }

    return this.http.get<any>(this.cartApiUrl, {
      headers: this.getAuthHeaders()
    });
  }

// 1. კალათაში დამატება (POST/PATCH)
addToCart(productId: string, quantity: any): Observable<any> {
  const url = 'https://api.everrest.educata.dev/shop/cart/product';
  const payload = { id: productId, 
    quantity: quantity };

  console.log('API-ზე იგზავნება payload:', payload);


  return this.http.post<any>(url, payload, {
    headers: this.getAuthHeaders()
  }).pipe(
    catchError((err) => {
      if (err.status === 400 || err.status === 409) {
        return this.getCart().pipe(
          switchMap((cart: any) => {
            // 2. ვპოულობთ ამ პროდუქტს კალათის სიაში
            const existingItem = cart.products.find((p: any) => p.productId === productId);
            
            // 3. ვანგარიშობთ ახალ ჯამს: არსებულს + 1 (ან იუზერის მიერ არჩეული)
            const newQuantity = existingItem ? existingItem.quantity + quantity : quantity;

            // 4. ახლა უკვე PATCH-ით ვაგზავნით ჯამურ რაოდენობას
            return this.http.patch<any>(url, { id: productId, quantity: newQuantity }, {
              headers: this.getAuthHeaders()
            });
          }),
          tap(() => this.updateCartCount())
        );
      }
      throw err;
    })
  );
}

// 2. კალათიდან წაშლა (DELETE) 
removeFromCart(id: string): Observable<any> {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    return new Observable(subscriber => subscriber.error('User not authenticated'));
  }

  // Swagger-ის მიხედვით: URL-ში ID არ გვინდა, ვატანთ Body-ში
  const options = {
    headers: this.getAuthHeaders(),
    body: { id: id } 
  };

  // URL უნდა იყოს: https://api.everrest.educata.dev/shop/cart/product
  return this.http.delete<any>(this.addToCartUrl, options).pipe(
    tap(() => this.updateCartCount())
  );
}


  // კალათის სრული გასუფთავება
  clearCart(): Observable<any> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      return new Observable(subscriber => {
        subscriber.error('User not authenticated');
        subscriber.complete();
      });
    }

    return this.http.delete<any>(this.cartApiUrl, {
      headers: this.getAuthHeaders()
    });
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = localStorage.getItem('auth_token');
    return !!token;
  }

  // Get user profile to verify token
  getUserProfile(): Observable<any> {
    if (!this.isAuthenticated()) {
      return new Observable(subscriber => {
        subscriber.error('Not authenticated');
        subscriber.complete();
        
      });

      
    }
    return this.http.get<any>('https://api.everrest.educata.dev/auth/me', {
      headers: this.getAuthHeaders()
    });
  }

  getUser() {
  const token = localStorage.getItem('auth_token');
  return this.http.get('https://api.everrest.educata.dev/auth', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
}
  

  // კალათის თვლის განახლება API-დან
  updateCartCount() {
    this.getCart().subscribe({
      next: (res) => {
        const items = res.products || res.items || [];
        const count = items.reduce((total: number, item: any) => total + (item.quantity || 1), 0);
        this.cartCount.set(count);
        this.cartItems.set(items);
      },
      error: (err) => {
        console.error('კალათის მიღებაში ერორი:', err);
        this.cartCount.set(0);
        this.cartItems.set([]);
      }
    });
  }
}