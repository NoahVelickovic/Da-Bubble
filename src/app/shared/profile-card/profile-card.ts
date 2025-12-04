import { Component, inject, Inject, EventEmitter, Output } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { directMessageContact } from '../../main/menu/direct-messages/direct-messages.model';
import { DirectChatService } from '../../services/direct-chat-service';

@Component({
  selector: 'app-profile-card',
  templateUrl: './profile-card.html',
  styleUrl: './profile-card.scss',
})
export class ProfileCard {
  @Output() ChatDirectMessage = new EventEmitter<directMessageContact>();

  dialogRef = inject(MatDialogRef<ProfileCard>);
  private dialog = inject(MatDialog);

  constructor(@Inject(MAT_DIALOG_DATA) public data: directMessageContact, private directChatService : DirectChatService) {}

  close() {
    this.dialogRef.close();
  }

openChatDirectMessage(dm: directMessageContact) {
  this.directChatService.openChat(dm);
  this.close();
}

}
