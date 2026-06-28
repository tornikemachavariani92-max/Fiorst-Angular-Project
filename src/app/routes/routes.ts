import { Routes } from '@angular/router';
import { MainComponent } from '../main/main';
import { AllProducts } from '../all-products/all-products';
import { Basket } from '../basket/basket';

export const routes: Routes = [
  { 
    path: 'shop', 
    component: MainComponent
  },
   {
    path: 'page2',
    component: AllProducts
   },

   {
    path: 'basket',
    component: Basket

   },

  { 
    path: '', 
    redirectTo: 'shop', 
    pathMatch: 'full' 
  }
];