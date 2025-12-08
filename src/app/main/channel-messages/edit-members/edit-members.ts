import { Component, Inject, signal, computed, inject, Input, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { ProfileCard } from '../../../shared/profile-card/profile-card';
import { AddMembers } from '../add-members/add-members';
import { Firestore, doc, docData } from '@angular/fire/firestore';
import { ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { ChannelStateService } from '../../menu/channels/channel.service';

type Member = {
  uid: string;
  name: string;
  avatar?: string;
  status?: string;
  isYou?: boolean;
};

type DialogData = {
  channelName?: string;
  members?: Member[];
  currentUserId?: string;
  channelId?: string;
};

@Component({
  selector: 'app-edit-members',
  imports: [CommonModule],
  templateUrl: './edit-members.html',
  styleUrl: './edit-members.scss',
})
export class EditMembers implements OnDestroy {
fullChannel: any = null;
  @Input() channel = '';
  @Input() channelId = '';
  @Input() members: Member[] = [];
  private cd = inject(ChangeDetectorRef);
  firestore = inject(Firestore);
private channelState = inject(ChannelStateService);
  channelName!: string;
  currentUserId!: string;

  membersSignal = signal<Member[]>([]);
  orderedMembers = computed(() => {
    const you = this.currentUserId;
    return [...this.membersSignal()].sort((a, b) => {
      const aYou = a.uid === you ? 1 : 0;
      const bYou = b.uid === you ? 1 : 0;
      return bYou - aYou;
    });
  });

  private firestoreSubscription: Subscription | null = null;

  constructor(
    private dialogRef: MatDialogRef<EditMembers>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData | null,
    private dialog: MatDialog
  ) { }

 ngOnInit() {
  

    if (this.data?.channelName) this.channelName = this.data.channelName;
    if (this.data?.currentUserId) this.currentUserId = this.data.currentUserId;

    const initial = this.data?.members?.length ? this.data.members : [];
    this.membersSignal.set([...initial]);
  }

  ngOnDestroy() {
    if (this.firestoreSubscription) {
      this.firestoreSubscription.unsubscribe();
    }
  }



  close() {
    this.dialogRef.close();
  }

  openProfile(member: any) {
    this.dialog.open(ProfileCard, {
      data: member,
      panelClass: 'profile-dialog-panel'
    });
  }

 openAddMembers(): void {
    const id = this.data?.channelId || this.channelId;
    const name = this.channelName;
    const members = this.membersSignal();

    this.dialogRef.close(); 

    this.dialog.open(AddMembers, {
      panelClass: 'add-members-dialog-panel',
      data: {
        channelId: id,
        channelName: name,
        existingMembers: members,
         },
    });
  }

  isYou(u: Member) { 
    return u.uid === this.currentUserId || /\(Du\)\s*$/.test(u.name); 
  }
}