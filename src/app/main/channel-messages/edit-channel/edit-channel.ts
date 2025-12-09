import { Component, inject, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { ChangeDetectorRef } from '@angular/core';
import { Firestore, doc, updateDoc, collection, deleteDoc, getDoc } from '@angular/fire/firestore';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { ChannelStateService } from '../../menu/channels/channel.service';





@Component({
  selector: 'app-edit-channel',
    standalone: true,
imports: [CommonModule, MatButtonModule, MatInputModule, FormsModule],
  templateUrl: './edit-channel.html',
  styleUrl: './edit-channel.scss',
})
export class EditChannel {
    dialogRef = inject(MatDialogRef<EditChannel>);
  data = inject(MAT_DIALOG_DATA);
  firestore = inject(Firestore);

  channel: any;
  editedName = '';
  editedDescription = '';
  showInputName = false;
  showInputDescription = false;
  closeName = true;
  closeDescription = true;

  constructor( private cdr: ChangeDetectorRef, private channelState: ChannelStateService) { }

 
ngOnInit() {
    this.channel = this.data.channel;
    this.editedName = this.channel.name || '';
    this.editedDescription = this.channel.description || '';

  }


  close() {
    this.dialogRef.close();
  }


  toggleEditName() {
    this.showInputName = true;
    this.closeName = false;
        this.editedName = this.channel.name || '';

  }

  toggleEditDescription() {
    this.showInputDescription = true;
    this.closeDescription = false;
        this.editedDescription = this.channel.description || '';


  }

 async saveEditName() {
  if (!this.editedName.trim()) return;

  const storedUser = localStorage.getItem('currentUser');
  if (!storedUser) return;
  const uid = JSON.parse(storedUser).uid;
  const userRef = doc(this.firestore, 'users', uid);
  const membershipsRef = collection(userRef, 'memberships');
  const membershipDocRef = doc(membershipsRef, this.channel.id);

  await updateDoc(membershipDocRef, { name: this.editedName.trim() });
  this.channel.name = this.editedName.trim();
  this.channelState.selectChannel(this.channel);

  this.showInputName = false;
  this.closeName = true;
  this.cdr.detectChanges();
  
}

async saveEditDescription() {
  const storedUser = localStorage.getItem('currentUser');
  if (!storedUser) return;
  const uid = JSON.parse(storedUser).uid;
  const userRef = doc(this.firestore, 'users', uid);
  const membershipsRef = collection(userRef, 'memberships');
  const membershipDocRef = doc(membershipsRef, this.channel.id);

  await updateDoc(membershipDocRef, { description: this.editedDescription.trim() });
  this.channel.description = this.editedDescription.trim();
  this.showInputDescription = false;
  this.closeDescription = true;
  this.cdr.detectChanges();
}

async leaveChannel() {
  try {
    const storedUser = localStorage.getItem('currentUser');
    if (!storedUser) return;
    const uid = JSON.parse(storedUser).uid;
    const channelId = this.channel.id;

    const userRef = doc(this.firestore, 'users', uid);
    const membershipRef = doc(userRef, 'memberships', channelId);
    await deleteDoc(membershipRef);


    const allMembers: any[] = this.channel.members || [];

    for (const member of allMembers) {
      if (member.uid === uid) continue;

      const otherUserRef = doc(this.firestore, `users/${member.uid}/memberships/${channelId}`);
      const otherSnap = await getDoc(otherUserRef);

      if (otherSnap.exists()) {
        const data = otherSnap.data();

        const updatedMembers = (data['members'] || []).filter((m: any) => m.uid !== uid);

        await updateDoc(otherUserRef, {
          members: updatedMembers
        });
      }
    }


    // 3️⃣ Channel aus UI entfernen
    this.channelState.removeChannel(channelId);
    await this.channelState.loadFirstAvailableChannel();
    this.dialogRef.close({ action: 'left', channelId });

  } catch (error) {
    console.error('Fehler beim Verlassen des Channels:', error);
    alert('Fehler beim Verlassen des Channels');
  }
}


}
