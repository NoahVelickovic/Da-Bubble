import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-legal-notice',
  imports: [],
  templateUrl: './legal-notice.html',
  styleUrl: './legal-notice.scss',
})
export class LegalNotice {
  constructor(private router: Router) {}

  goBack() {
    localStorage.setItem('skipIntro', 'true');
    this.router.navigate(['/'])
}
}
