import { Injectable, signal, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LayoutService {
  showLeft = signal(true);
  showRight = signal(false);
  isMobile = signal(false);

  constructor() {
    this.checkWidth();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => this.checkWidth());
    }
  }

  private checkWidth() {
    if (typeof window !== 'undefined') {
      const wasMobile = this.isMobile();
      this.isMobile.set(window.innerWidth <= 750);
      
      // Auf Mobile standardmäßig Menu anzeigen
      if (this.isMobile() && !wasMobile) {
        this.showLeft.set(true);
        this.showRight.set(false);
      }
    }
  }

  closeRight() {
    this.showRight.set(false);
  }

  openRight() {
    this.showRight.set(true);
  }

  toggleLeft() {
    this.showLeft.set(!this.showLeft());
  }

  // Auf Mobile: Zeige Content und verstecke Menu
  showContent() {
    if (this.isMobile()) {
      this.showLeft.set(false);
    }
  }

  // Auf Mobile: Zeige Menu und verstecke Content
  showMenu() {
    if (this.isMobile()) {
      this.showLeft.set(true);
      this.showRight.set(false); // Close threads when going back to menu
    }
  }

  // Auf Mobile: Öffne Thread als Fullscreen
  openThread() {
    this.showRight.set(true);
  }

  // Auf Mobile: Schließe Thread und gehe zurück zum Content
  closeThread() {
    this.showRight.set(false);
  }
}
