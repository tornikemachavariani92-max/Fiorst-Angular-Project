import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'; // 👈 დაამატე ესენი
import Swal from 'sweetalert2';
import { RouterLink, Router } from '@angular/router';
import { ModalService } from '../modal';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [ReactiveFormsModule], 
  templateUrl: './auth-modal.html',
  styleUrl: './auth-modal.scss'
})
export class AuthModalComponent {
  constructor(public modalService: ModalService) {}
  private http = inject(HttpClient);
  private router = inject(Router);
  Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true
  });

  
  public isLoginMode = true; 
  public isVisible = false;

  // 2. ფორმების ინიციალიზაცია
  signupForm = new FormGroup({
  firstName: new FormControl('', Validators.required),
  lastName: new FormControl('', Validators.required),
  email: new FormControl('', [Validators.required, Validators.email]),
  password: new FormControl('', [Validators.required, Validators.minLength(8)]),
  age: new FormControl(null, Validators.required),
  gender: new FormControl('MALE'),
  // აი ესენი გაკლია ლოგების მიხედვით:
  address: new FormControl('', Validators.required), 
  phone: new FormControl('', Validators.required),
  zipcode: new FormControl('', Validators.required),
  avatar: new FormControl('')
});

  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', Validators.required)
  });

  // 3. მოდალის მართვის ფუნქციები 
  open() {
    this.isVisible = true;
  }

  close() {
    this.isVisible = false;
  }

  toggleMode() {
  this.isLoginMode = !this.isLoginMode;
  console.log('რეჟიმი შეიცვალა. Login Mode:', this.isLoginMode);
}

  // ================== SIGN UP ==================
  onSignup() {
    const signupUrl = 'https://api.everrest.educata.dev/auth/sign_up'; // 👈 გამოიყენე /shop/ მისამართი

    if (this.signupForm.valid) {
      this.http.post(signupUrl, this.signupForm.value).subscribe({
        next: (res) => {
          Swal.fire({
  title: 'რეგისტრაცია წარმატებულია!',
  text: 'ახლა შეგიძლიათ გაიაროთ ავტორიზაცია',
  icon: 'success', 
  confirmButtonText: 'გასაგებია',
  confirmButtonColor: '#3085d6', 
  timer: 3000, 
  timerProgressBar: true 
}).then(() => {
  
  this.router.navigate(['/login']);
});
          this.isLoginMode = true;
        },
        error: (err) => alert('შეცდომა: ' + err.error.message)
      });
    }
  }


  // ================== LOGIN ==================
  onLogin() {
  const loginUrl = 'https://api.everrest.educata.dev/auth/sign_in';

  if (this.loginForm.valid) {
    this.http.post<any>(loginUrl, this.loginForm.value).subscribe({
      next: (res) => {
        // 1. ვინახავთ მონაცემებს
        localStorage.setItem('auth_token', res.access_token);
        localStorage.setItem('user_email', this.loginForm.value.email!);

        // 2. გამოვაჩენთ წარმატების შეტყობინებას და ველოდებით მის დასრულებას
        this.Toast.fire({
          icon: 'success',
          title: 'წარმატებით შეხვედით!'
        }).then(() => {
          this.close(); // ვხურავთ მოდალს
          window.location.reload(); // ვარესტარტებთ გვერდს (მხოლოდ წარმატებისას!)
        });
      },
      error: (err) => {
        //  შეცდომის დროს რესტარტი არ გვინდა, უბრალოდ ვეუბნებით მომხმარებელს
        this.Toast.fire({
          icon: 'error',
          title: 'იმეილი ან პაროლი არასწორია',
          text: 'გთხოვთ, გადაამოწმოთ მონაცემები' // სურვილისამებრ დამატებითი ტექსტი
        });
        console.error('ავტორიზაციის შეცდომა:', err);
      }
    });
  } else {
    // თუ ფორმა ვალიდური არაა (მაგალითად ცარიელია)
    this.Toast.fire({
      icon: 'warning',
      title: 'შეავსეთ ყველა ველი!'
    });
  }
}
}