import { Component, inject, Inject, EventEmitter, Output } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatDialog } from '@angular/material/dialog';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { directMessageContact } from '../../main/menu/direct-messages/direct-messages.model';



@Component({
  selector: 'app-profile-card',
  imports: [],
  templateUrl: './profile-card.html',
  styleUrl: './profile-card.scss',
})
export class ProfileCard {
   @Output() ChatDirectMessage = new EventEmitter<directMessageContact>();

  dialogRef = inject(MatDialogRef<ProfileCard>);
  private dialog = inject(MatDialog);
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}

  close() {
    this.dialogRef.close();
  }


  openChatDirectMessage(dm: directMessageContact) {
      console.log('Klick erkannt'); 
      this.ChatDirectMessage.emit(dm);
    }

}
