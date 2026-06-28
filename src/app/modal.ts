import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root' // ეს ნიშნავს, რომ სერვისი ხელმისაწვდომია მთელ პროექტში
})
export class ModalService {
  // Signal-ები მდგომარეობის სამართავად
  isVisible = signal(false);
  isLoginMode = signal(true);

  // ახალი სიგნალი ავტორიზაციისთვის
  isLoggedIn = signal(false);

  // მეთოდი მოდალის გასაღებად
  open(loginMode: boolean = true) {
    this.isLoginMode.set(loginMode);
    this.isVisible.set(true);
  }

  // მეთოდი მოდალის დასახურად
  close() {
    this.isVisible.set(false);
  }

  // ფუნქცია დასალოგინებლად (ამას გამოიძახებ, როცა Log In ფორმას დაასუბმითებ)
  login() {
    this.isLoggedIn.set(true);
    this.close();
  }

  // ფუნქცია გამოსასვლელად
  logout() {
    this.isLoggedIn.set(false);
  }
}