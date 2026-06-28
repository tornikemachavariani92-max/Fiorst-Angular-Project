import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api'; 
import { CardComponent } from '../card/card'; 
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-all-products',
  standalone: true, 
  imports: [CardComponent, CommonModule, FormsModule], 
  templateUrl: './all-products.html',
  styleUrl: './all-products.scss',
})
export class AllProducts implements OnInit {
  public api = inject(ApiService);

  categories = signal<any[]>([]);
  brands = signal<string[]>([]);
  isCategoryOpen = signal(false);
  isBrandOpen = signal(false);
  isPriceOpen = signal(false);

  selectedCategoryId = signal<string | null>(null);
  selectedBrand = signal<string | null>(null);
  selectedRating = signal<number>(0);
  currentPage = signal(1);
  limit = 8;

  tempMin = signal<number | null>(null);
  tempMax = signal<number | null>(null);
  appliedMin = signal<number>(0);
  appliedMax = signal<number>(Infinity);

  // ფილტრაციის მთავარი ლოგიკა
  filteredProducts = computed(() => {
    let products = this.api.allProducts();
    const selectedId = this.selectedCategoryId();

    if (selectedId) {
    products = products.filter(p => {
      
      const catName = p.category?.name || p.category;
      const catId = p.category?._id || p.category?.id;

      // 2. შევადაროთ არჩეულ მნიშვნელობას (Laptops ან ID)
      return String(catName).toLowerCase() === String(selectedId).toLowerCase() || 
             String(catId) === String(selectedId);
    });
  }
    if (this.selectedBrand()) {
      products = products.filter(p => p.brand?.toLowerCase() === this.selectedBrand()?.toLowerCase());
    }
    if (this.selectedRating() > 0) {
      products = products.filter(p => (p.rating?.value || p.rating || 0) >= this.selectedRating());
    }
    
    const min = this.appliedMin();
    const max = this.appliedMax();
    products = products.filter(p => {
      const price = p.price?.current ?? p.price ?? 0;
      return price >= min && price <= max;
    });

    return products;
  });

  // გვერდების სიის ავტომატური გენერაცია
  pageList = computed(() => {
    const count = Math.ceil(this.filteredProducts().length / this.limit);
    return Array.from({ length: count }, (_, i) => i + 1);
  });

  // მიმდინარე გვერდზე გამოსაჩენი ბარათები
  displayCards = computed(() => {
    const start = (this.currentPage() - 1) * this.limit;
    return this.filteredProducts().slice(start, start + this.limit);
  });

  ngOnInit() {
    this.api.getCategories().subscribe(res => this.categories.set(res));
    this.api.getBrands().subscribe(res => this.brands.set(res));
    this.api.fetchCards();
  }

  togglePrice() { this.isPriceOpen.update(v => !v); }

  applyPriceFilter() {
    this.appliedMin.set(Number(this.tempMin()) || 0);
    this.appliedMax.set(Number(this.tempMax()) || Infinity);
    this.currentPage.set(1);
  }

  filterByCategory(id: any) {if (this.selectedCategoryId() === id) {
    this.selectedCategoryId.set(null); 
  } else {
    this.selectedCategoryId.set(id);   
  }
  this.currentPage.set(1); 
}
  filterByBrand(name: any) {if (this.selectedBrand() === name) {
    this.selectedBrand.set(null);
  } else {
    this.selectedBrand.set(name);
  }
  this.currentPage.set(1);}
  filterByRating(val: number) { this.selectedRating.set(val); this.currentPage.set(1); }
  onPageClick(p: number) { this.currentPage.set(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }

  resetFilters() {
    this.selectedCategoryId.set(null);
    this.selectedBrand.set(null);
    this.selectedRating.set(0);
    this.appliedMin.set(0);
    this.appliedMax.set(Infinity);
    this.tempMin.set(null);
    this.tempMax.set(null);
    this.currentPage.set(1);
  }
}