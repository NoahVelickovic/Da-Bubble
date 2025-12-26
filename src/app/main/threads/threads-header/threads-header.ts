import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ThreadStateService } from '../../../services/thread-state.service';

@Component({
  selector: 'app-threads-header',
  imports: [CommonModule, FormsModule],
  templateUrl: './threads-header.html',
  styleUrl: './threads-header.scss',
})
export class ThreadsHeader {
  private dialog = inject(MatDialog);
  private state = inject(ThreadStateService);

  get channelName() {
    return this.state.value?.channelName ?? '';
  }

  closeThread() {
    this.state.close();
  }
}