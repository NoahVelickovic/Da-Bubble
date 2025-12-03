import { Component, inject, EventEmitter, Output, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { AddEmojis } from '../../channel-messages/add-emojis/add-emojis';
import { AtMembers } from '../../channel-messages/at-members/at-members';
import { CommonModule } from '@angular/common';
import { directMessageContact } from '../direct-messages/direct-messages.model';
import { ProfileCard } from '../../../shared/profile-card/profile-card';
@Component({
  selector: 'app-chat-direct-you',
  imports: [],
  templateUrl: './chat-direct-you.html',
  styleUrl: './chat-direct-you.scss',
})
export class ChatDirectYou {

 @Input() chatUser: directMessageContact | null = null;
@Output() close = new EventEmitter<void>();
    private dialog = inject(MatDialog)


  closeMessage() {
    this.close.emit(); 
  }


  openAddEmojis() {
      this.dialog.open(AddEmojis, {
        panelClass: 'add-emojis-dialog-panel'
      });
    }
  
    openAtMembers() {
      this.dialog.open(AtMembers, {
        panelClass: 'at-members-dialog-panel'
      });
    }

    sendMessage() {
  
  }

  openProfile(member: any) {
      this.dialog.open(ProfileCard, {
      data: member,
        panelClass: 'profile-dialog-panel'
      });
    }
}

