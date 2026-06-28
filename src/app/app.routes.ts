import { Routes } from '@angular/router';
import { MainComponent } from './main/main';
import { AllProducts } from './all-products/all-products';
import { Basket } from './basket/basket';
import { ProductDetailsComponent } from './product-details/product-details';

export const routes: Routes = [
  { path: 'shop', component: MainComponent,  },
  { path: 'allProducts', component: AllProducts,},
  { path: 'product/:id', component: ProductDetailsComponent },
  { path: 'basket', component: Basket},
  { path: '', redirectTo: 'shop', pathMatch: 'full' }
];
