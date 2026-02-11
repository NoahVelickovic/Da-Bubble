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
      const w = window.innerWidth;
      const wasMobile = this.isMobile();
      this.isMobile.set(w <= 950);

      // Auf Mobile standardmäßig Menu anzeigen
      if (this.isMobile() && !wasMobile) {
        this.showLeft.set(true);
        this.showRight.set(false);
      }

      // Unter 1400px: max. 2 Bereiche offen – wenn Menu + Threads offen, Menu schließen
      if (w < 1400 && this.showLeft() && this.showRight()) {
        this.showLeft.set(false);
      }
    }
  }

  /** Unter 1400px nur max. 2 Bereiche (Menu oder Threads), ab 1400px alle 3 möglich */
  private isTwoPanelMax(): boolean {
    return typeof window !== 'undefined' && window.innerWidth < 1400;
  }

  closeRight() {
    this.showRight.set(false);
  }

  openRight() {
    if (this.isTwoPanelMax() && this.showLeft()) {
      this.showLeft.set(false);
    }
    this.showRight.set(true);
  }

  toggleLeft() {
    if (this.isTwoPanelMax() && !this.showLeft()) {
      this.showRight.set(false);
    }
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
