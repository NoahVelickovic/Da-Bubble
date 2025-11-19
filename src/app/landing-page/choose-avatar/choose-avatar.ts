import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-choose-avatar',
  imports: [CommonModule, FormsModule , RouterModule],
  templateUrl: './choose-avatar.html',
  styleUrl: './choose-avatar.scss',
})
export class ChooseAvatar {
  constructor(private router: Router) {}

  text = '';
  email = '';
  password = '';
  acceptedPrivacy = false;

  submitted = false;
  nameError = false;
  emailError = false;
  passwordError = false;
  privacyError = false;

  /** Email RegEx */
  isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  signUp() {
    this.router.navigate(['/']);
  }

  goBack() {
    localStorage.setItem('skipIntro', 'true');
    this.router.navigate(['/signup']);
  }
}
