import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-privacy-policy',
  imports: [],
  templateUrl: './privacy-policy.html',
  styleUrl: './privacy-policy.scss',
})
export class PrivacyPolicy {
  constructor(private router: Router) {}

  goBack() {
    localStorage.setItem('skipIntro', 'true');
    this.router.navigate(['/'])
}
}
