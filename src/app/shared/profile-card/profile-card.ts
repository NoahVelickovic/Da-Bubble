import { Component, inject, Inject, EventEmitter, Output } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { directMessageContact } from '../../main/menu/direct-messages/direct-messages.model';
import { DirectChatService } from '../../services/direct-chat-service';
import { Router } from '@angular/router';
import { PresenceService } from '../../services/presence.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile-card',
  templateUrl: './profile-card.html',
  imports: [CommonModule],
  styleUrl: './profile-card.scss',
})
export class ProfileCard {
  @Output() ChatDirectMessage = new EventEmitter<directMessageContact>();

  dialogRef = inject(MatDialogRef<ProfileCard>);
  private dialog = inject(MatDialog);
  private directChatService = inject(DirectChatService);
  private router = inject(Router);
  public presence = inject(PresenceService);
  dm: any;

  constructor(
  @Inject(MAT_DIALOG_DATA)
  public data: {
    uid: string;
    name: string;
    avatar: string;
    email: string;
    createdAt: Date;
  }
) {}

  close() {
    this.dialogRef.close();
  }

  closeAllDialogs() {
    this.dialog.closeAll();
  }

 openChatDirectMessage() {
  const storedUser = localStorage.getItem('currentUser');
  const currentUserId = storedUser
    ? JSON.parse(storedUser).uid
    : null;

  if (this.data.uid === currentUserId) {
    this.router.navigate(['/main/direct-you']);
    this.closeAllDialogs();
    return;
  }

  const dm: directMessageContact = {
    id: this.data.uid,
    name: this.data.name,
    avatar: this.data.avatar,
    email: this.data.email,
    createdAt: this.data.createdAt,
    state: false
  };

  this.directChatService.openChat(dm);
  this.router.navigate(['/main/direct-message', dm.name]);
  this.closeAllDialogs();
}

  getStatus(uid: string): 'online' | 'offline' {
    const map = this.presence.userStatusMap();
    return map[uid] ?? 'offline';
  }
}
