import { Component, inject, signal, computed, ChangeDetectorRef, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Firestore, doc, updateDoc, arrayUnion, collection, collectionData, setDoc } from '@angular/fire/firestore';
import { map } from 'rxjs';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ChannelStateService } from '../../menu/channels/channel.service';
import { getDoc } from '@angular/fire/firestore';

type Member = {
  uid: string;
  name: string;
  avatar?: string;
  status?: string;
  isYou?: boolean;
  email?: string;
};

type DialogData = {
  channelName?: string;
  members?: Member[];
  currentUserId?: string;
  channelId?: string;
  fullChannel?: any; // 🔥 Hinzufügen, damit TS nicht mehr meckert
  existingMembers?: Member[];
  channelState?: any;
};

@Component({
  selector: 'app-add-members',
  imports: [CommonModule, FormsModule],
  templateUrl: './add-members.html',
  styleUrl: './add-members.scss',
})
export class AddMembers {
  private dialogRef = inject(MatDialogRef<AddMembers>);
  data = inject(MAT_DIALOG_DATA);
  private cd = inject(ChangeDetectorRef);
  firestore = inject(Firestore);
  
fullChannel: any = null;
  @Input() channel = '';
  @Input() channelId = '';
  @Input() members: Member[] = [];
  
  allMembers: Member[] = [];
  channelName = this.data.channelName;
  existingMembers = signal<Member[]>([]);

  query = signal('');
  hasFocus = signal(false);
  activeIndex = signal<number>(-1);
  selected = signal<Member[]>([]);
  isSubmitting = signal(false);
  constructor( private cdr: ChangeDetectorRef, private channelState: ChannelStateService) { }

  ngOnInit() {
    // 1. Daten übernehmen
   const data = this.data as DialogData; // 🔥 Sicherstellen, dass das Interface genutzt wird

  this.channelId = data.channelId || '';
  this.channelName = data.channelName || '';
  
  // 🔥 Hier wird das Objekt aus dem vorherigen Dialog übernommen
  this.fullChannel = data.fullChannel;

  if (data.existingMembers) {
    this.existingMembers.set(data.existingMembers);
  }

    const dmRef = collection(this.firestore, 'directMessages');
collectionData(dmRef, { idField: 'uid' })
  .pipe(
    map(users => users.map(u => ({ 
        uid: u['uid'] ?? crypto.randomUUID(), 
        name: u['name'] ?? 'Unbekannter Benutzer', // 🔥 Fallback für fehlenden Namen
        avatar: u['avatar'] ?? 'default-avatar.png', // 🔥 Optionaler Fallback für Avatar
        status: u['status'] ?? 'offline' 
    } as Member))) 
  )
  .subscribe(list => {
    this.allMembers = list;
    
    this.members = list; 
    this.cd.detectChanges();
  });
  }

  suggestions = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return [];
    
    const existingIds = new Set(this.existingMembers().map(u => u.uid));
    const selectedIds = new Set(this.selected().map(u => u.uid));
    const allExcluded = new Set([...existingIds, ...selectedIds]);
    
    const filtered = this.members
      .filter(m => !allExcluded.has(m.uid) && m.name.toLowerCase().includes(q))
      .slice(0, 6);
    
    console.log('🔍 Suggestions gefiltert:', filtered.length, 'von', this.members.length);
    return filtered;
  });

  showDropdown = computed(() =>
    this.hasFocus() && this.query().trim().length > 0 && this.suggestions().length > 0
  );

  onKeyDown(e: KeyboardEvent) {
    const list = this.suggestions();
    if (!list.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.activeIndex.set((this.activeIndex() + 1) % list.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.activeIndex.set((this.activeIndex() - 1 + list.length) % list.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const idx = this.activeIndex();
      if (idx >= 0 && idx < list.length) this.selectUser(list[idx]);
    } else if (e.key === 'Escape') {
      this.hasFocus.set(false);
      this.activeIndex.set(-1);
    }
  }

  selectUser(u: Member) {
    if (this.selected().find(x => x.uid === u.uid)) {
      return;
    }
    if (this.existingMembers().find(x => x.uid === u.uid)) {
      return;
    }
    
    this.selected.update(arr => [...arr, u]);
    this.query.set('');
    this.activeIndex.set(-1);
  }

  removeSelected(uid: string) {
    const user = this.selected().find(u => u.uid === uid);
    this.selected.update(arr => arr.filter(u => u.uid !== uid));
  }

async addMembers() {
  if (this.isSubmitting()) return;
  if (!this.selected().length) { this.close(); return; }

  this.isSubmitting.set(true);

  const storedUser = localStorage.getItem('currentUser');
  if (!storedUser) return;
  const currentUid = JSON.parse(storedUser).uid;
  const channelId = this.channelId;

  try {
    // 1️⃣ Alle UIDs zusammenstellen (der aktuelle User + ausgewählte Mitglieder)
    let memberUids: string[] = [currentUid];

    memberUids.push(...this.selected().map(u => u.uid));

    memberUids = Array.from(new Set(memberUids));

    for (const userUid of memberUids) {
      await this.handleUserChannelMembership(userUid, channelId, memberUids);
    }

    const membershipRef = doc(this.firestore, `users/${currentUid}/memberships/${channelId}`);
    const snap = await getDoc(membershipRef);
    if (snap.exists()) {
      const freshChannelData = snap.data();
      const channelWithId = { ...freshChannelData, id: channelId };
      this.channelState.selectChannel(channelWithId);
    }

    await new Promise(r => setTimeout(r, 200)); 
    this.dialogRef.close({ success: true, added: this.selected() });

  } catch (err) {
    console.error('Fehler beim Hinzufügen von Mitgliedern:', err);
    this.isSubmitting.set(false);
  }
}


 async handleUserChannelMembership(userUid: string, channelId: string, allMemberUids: string[]) {
    try {
      const storedUser = localStorage.getItem('currentUser');
      const currentUid = storedUser ? JSON.parse(storedUser).uid : '';

      const channelData = await this.fetchChannelData(currentUid, channelId);
      const allMembers = await this.fetchMemberDetails(currentUid, allMemberUids);

      await this.setChannelMembership(userUid, channelId, channelData, allMembers);
    } catch (err) {
      console.error(`Fehler für User ${userUid}:`, err);
    }
  }

  async fetchChannelData(currentUid: string, channelId: string) {
    const ref = doc(this.firestore, `users/${currentUid}/memberships/${channelId}`);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() : {};
  }

  async fetchMemberDetails(currentUid: string, allMemberUids: string[]) {
    const allMembers: Member[] = [];
    for (const uid of allMemberUids) {
      const dmRef = doc(this.firestore, `directMessages/${uid}`);
      const dmSnap = await getDoc(dmRef);
      if (dmSnap.exists()) {
        const userData = dmSnap.data();
        allMembers.push({
          uid,
          name: uid === currentUid ? `${userData['name']} (Du)` : userData['name'],
          avatar: userData['avatar'] || 'avatar-0.png',
          email: userData['email'] || '',
          status: 'online',
          isYou: uid === currentUid
        });
      }
    }
    return allMembers;
  }

 async setChannelMembership(
  userUid: string,
  channelId: string,
  channelData: any,
  allMembers: Member[]
) {

  const ref = doc(this.firestore, `users/${userUid}/memberships/${channelId}`);
  const snap = await getDoc(ref);

  let existingMembers: Member[] = [];

  if (snap.exists()) {
    const data = snap.data();
    existingMembers = Array.isArray(data['members']) ? data['members'] : [];
  }

  const mergedMembers = [
    ...existingMembers,
    ...allMembers.filter(newUser =>
      !existingMembers.some(old => old.uid === newUser.uid)
    ),
  ];

  const updatedData = {
    channelId,
    name: channelData['name'] || 'Neuer Channel',
    description: channelData['description'] || '',
    joinedAt: snap.exists() ? snap.data()['joinedAt'] : new Date(),
    createdBy: channelData['createdBy'] || 'Unbekannt',
    members: mergedMembers,
  };

  await setDoc(ref, updatedData);
}

  close() {
    console.log('🚪 Dialog geschlossen ohne Änderungen');
    this.dialogRef.close();
  }
}