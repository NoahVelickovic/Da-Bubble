import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Firestore, collection, doc, collectionData } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { AddChannel } from '../add-channel/add-channel';
import { ChannelStateService } from './channel.service';

@Component({
  selector: 'app-channels',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './channels.html',
  styleUrl: './channels.scss',
})
export class Channels implements OnInit {
  firestore: Firestore = inject(Firestore);
  router = inject(Router);
  memberships: any[] = [];
  selectedChannelId: string = '';

  constructor(
    private dialog: MatDialog, 
    private cdr: ChangeDetectorRef, 
    private channelState: ChannelStateService
  ) { }

  ngOnInit() {
    this.loadData();
    this.channelState.selectedChannel$.subscribe(channel => {
      if (channel) {
        this.selectedChannelId = channel.id;
        this.cdr.detectChanges();
      }
    });
  }

  loadData() {
    const storedUser = localStorage.getItem('currentUser');
    if (!storedUser) return;

    const uid = JSON.parse(storedUser).uid;
    if (!uid) return;

    const userRef = doc(this.firestore, 'users', uid);
    const membershipsRef = collection(userRef, 'memberships');

    collectionData(membershipsRef, { idField: 'id' }).subscribe(memberships => {
      this.memberships = memberships;
      this.cdr.detectChanges();
            const currentChannel = this.channelState.getSelectedChannel();


      if (memberships.length > 0 && !this.selectedChannelId) {
        this.onChannelClick(memberships[0]);
      }
    });
  }

  openDialog() {
    this.dialog.open(AddChannel, { panelClass: 'add-channel-dialog-panel' });
  }

  onChannelClick(channel: any) {
    this.selectedChannelId = channel.id;
    this.channelState.selectChannel(channel);
    this.router.navigate(['/main/channels']);
  }
}