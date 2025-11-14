import { Component } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [
    FormsModule,
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    RouterLink,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  email = '';
  password = '';
  submitted = false;
  emailError = false;
  loginError = false;

  constructor(private router: Router) {}

  login() {
        this.submitted = true;

    if (!this.email || !this.email.includes("@")) {
      this.emailError = true;
    } else {
      this.emailError = false;
    }

    if (!this.password) {
      this.loginError = true;
    } else {
      this.loginError = false;
    }
    if (this.email && this.password) {
      this.router.navigate(['/main']);
    }
  }

  guestLogin() {
    this.router.navigate(['/main']);
  }
}
