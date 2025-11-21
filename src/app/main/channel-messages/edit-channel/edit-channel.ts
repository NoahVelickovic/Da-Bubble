import { Component, inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FirebaseService } from '../../../services/firebase';
import { Channel } from "../../../main/menu/channels/channel.model";
import { Observable } from 'rxjs';
import { ChannelStoreService } from '../edit-channel/edit-file.service';



@Component({
  selector: 'app-edit-channel',
  imports: [CommonModule],
  templateUrl: './edit-channel.html',
  styleUrl: './edit-channel.scss',
})
export class EditChannel {
  dialogRef = inject(MatDialogRef<EditChannel>);
  showInputName = false;
  showInputDescription = false;
  closeName = true;
  closeDescription = true;
  channels: Channel[] = [];

  constructor(private channelStore: ChannelStoreService) { }

  async ngOnInit() {
    await this.channelStore.loadChannels();
    this.channels = this.channelStore.getChannelsSync();
  }


  close() {
    this.dialogRef.close();
  }


  toggleEditName() {
    this.showInputName = true;
    this.closeName = false;
  }

  toggleEditDescription() {
    this.showInputDescription = true;
    this.closeDescription = false;

  }

  saveEditName() {
    this.showInputName = false;
    this.closeName = true;
  }

  saveEditDescription() {
    this.showInputDescription = false;
    this.closeDescription = true;

  }


}
