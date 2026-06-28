import { Component, signal, computed, ViewChild, OnInit, inject, HostListener, 
  ElementRef } from '@angular/core';
import { ApiService } from '../services/api'; 
import { RouterLink, Router } from '@angular/router';
import { AuthModalComponent } from '../auth-modal/auth-modal';
import { CommonModule } from '@angular/common'; // დავამატოთ CommonModule @if-ისთვის
import { ModalService } from '../modal';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.html',
  styleUrls: ['./header.scss'],
  imports: [RouterLink, CommonModule], // CommonModule საჭიროა დირექტივებისთვის
})
export class HeaderComponent implements OnInit {
  constructor(public modalService: ModalService) {} // ინექცია
  @ViewChild('authModal') authModal!: AuthModalComponent;
  isMobileProfileOpen = false;
  currentUser: any = null
  isDropdownOpen = false; // მენიუს გასაღებად
  isMenuOpen = signal(false);
  userEmail: string | null = null;
  searchTerm = signal(''); 
  public api = inject(ApiService);
  private eRef = inject(ElementRef); // 👈 დაემატა ElementRef ინექცია
  private router = inject(Router);


  

  // --- მენიუს გარეთ დაჭერის მოსმენა ---
  @HostListener('document:click', ['$event'])
  clickout(event: any) {
    // თუ დავაჭირეთ კომპონენტის გარეთ, ვხურავთ Dropdown-ს
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.isDropdownOpen = false;
    }
  }

  suggestions = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (term.length < 2) return [];
    return this.api.displayCards().filter(p => 
      p.title.toLowerCase().includes(term)
    ).slice(0, 5);
  });

  toggleMobileProfile() {
    this.isMobileProfileOpen = !this.isMobileProfileOpen;
  }

 ngOnInit() {
    this.userEmail = localStorage.getItem('user_email');
    const token = localStorage.getItem('auth_token');

    if (token) {
      this.api.getUser().subscribe({
        next: (res: any) => {
          this.currentUser = res;
          console.log('ავტორიზებული მომხმარებელი:', res);
          
          // 🚀 აი ეს დაამატე:
          this.modalService.isLoggedIn.set(true); 
        },
        error: (err) => {
          console.log('ტოკენი არავალიდურია', err);
          localStorage.removeItem('auth_token');
          this.currentUser = null;
          
          // ❌ და ესეც, რომ ღილაკები ისევ გამოჩნდეს:
          this.modalService.isLoggedIn.set(false); 
        }
      });
    } else {
      // თუ ტოკენი საერთოდ არ არის
      this.modalService.isLoggedIn.set(false);
    }
}

  goToCart() {
    this.isDropdownOpen = false; // მენიუ დავხუროთ
    this.router.navigate(['/basket']); // გადავიდეთ კალათის გვერდზე
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  onSearchChange(event: any) {
    this.searchTerm.set(event.target.value);
  }

  toggleMenu() {
    this.isMenuOpen.update(prev => !prev);
    document.body.style.overflow = this.isMenuOpen() ? 'hidden' : 'auto';
  }

  closeMenu() {
    this.isMenuOpen.set(false);
    document.body.style.overflow = 'auto';
    this.isMobileProfileOpen = false;
  }

  openLogin() {
    this.modalService.open(true); // 'true' ნიშნავს, რომ Login რეჟიმი ჩაირთოს
  }

  openSignup() {
    this.modalService.open(false); // 'false' ნიშნავს, რომ Signup რეჟიმი ჩაირთოს
  }

  logout() {
    Swal.fire({
    title: 'ნამდვილად გსურთ გასვლა?',
    text: "თქვენი სესია დასრულდება!",
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'დიახ, გასვლა',
    cancelButtonText: 'გაუქმება',
    reverseButtons: true // ატრიალებს ღილაკებს ადგილებს (უფრო ბუნებრივია)
  }).then((result) => {
    if (result.isConfirmed) {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_email');
    this.currentUser = null;
    this.isDropdownOpen = false;
    window.location.reload();
    // ლამაზი შეტყობინება გასვლისას
      Swal.fire({
        title: 'ნახვამდის!',
        text: 'თქვენ წარმატებით გამოხვედით.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      }).then(() => {
        window.location.reload(); // ან გადაიყვანე მთავარ გვერდზე
      });
    }
  });
  }

  removeItem(productId: string) {
  Swal.fire({
    title: 'წავშალოთ ნივთი?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'წაშლა',
    cancelButtonText: 'დატოვება'
  }).then((result) => {
    if (result.isConfirmed) {
      //  წაშლის ლოგიკა
      this.api.removeFromCart(productId); 
      Swal.fire('წაშლილია!', '', 'success');
    }
  });
}

  selectProduct(product: any) {
    this.searchTerm.set('');
    const id = product._id;
    this.router.navigate(['/product', id]);
  }
}
