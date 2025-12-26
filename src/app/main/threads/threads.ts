import { Component, HostListener, inject } from '@angular/core';
import { ThreadsHeader } from "./threads-header/threads-header";
import { MessadesThreads } from "./messages-threads/messades-threads";
import { CommonModule } from '@angular/common';
import { ThreadStateService } from '../../services/thread-state.service';

@Component({
  selector: 'app-threads',
  imports: [ThreadsHeader, MessadesThreads, CommonModule],
  templateUrl: './threads.html',
  styleUrls: ['./threads.scss'],
})
export class Threads {
  private state = inject(ThreadStateService);

  isMobile = false;
  isVisible = true;

  constructor() {
    this.checkWidth();

    this.state.ctx$.subscribe(ctx => {
      this.isVisible = !this.isMobile && !!ctx;
    });
  }


  @HostListener('window:resize')
  checkWidth() {
    this.isMobile = window.innerWidth <= 650;
    this.isVisible = !this.isMobile && !!this.state.value;
  }
}