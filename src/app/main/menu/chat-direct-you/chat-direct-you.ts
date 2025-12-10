import { Component, inject, EventEmitter, Output, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { AddEmojis } from '../../channel-messages/add-emojis/add-emojis';
import { AtMembers } from '../../channel-messages/at-members/at-members';
import { CommonModule } from '@angular/common';
import { directMessageContact } from '../direct-messages/direct-messages.model';
import { ProfileCard } from '../../../shared/profile-card/profile-card';
import { ChangeDetectorRef } from '@angular/core';
import { Firestore, getDoc, doc } from '@angular/fire/firestore';
import { FirebaseService } from '../../../services/firebase';
import { Observable } from 'rxjs';
import { Profile } from '../../header/profile/profile';





@Component({
  selector: 'app-chat-direct-you',
  imports: [CommonModule,],
  templateUrl: './chat-direct-you.html',
  styleUrl: './chat-direct-you.scss',
})
export class ChatDirectYou {

  @Input() chatUser: directMessageContact | null = null;
  @Output() close = new EventEmitter<void>();
  private dialog = inject(MatDialog)
  private firestore = inject(Firestore);
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  userName: string = '';
  userAvatar: string = '';
  isMobile = false;
  mobileMenuOpen = false;
  constructor(private firebaseService: FirebaseService) { }
  directMessage$: Observable<directMessageContact[]> | undefined;


  async ngOnInit() {
    this.directMessage$ = this.firebaseService.getCollection$('directMessages');

    await this.initUserId();
    this.firebaseService.currentName$.subscribe((name) => {
      if (name) {
        this.userName = name;
        this.cdr.detectChanges();
      }
    });
  }


  async initUserId() {
    const storedUser = localStorage.getItem('currentUser');
    if (!storedUser) return;
    const uid = JSON.parse(storedUser).uid;

    if (!uid) return;

    const userRef = doc(this.firestore, 'directMessages', uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data: any = snap.data();
      this.userName = data.name;
            this.userAvatar = data.avatar;

      this.firebaseService.setName(this.userName);
      this.cdr.detectChanges();
    }

  }

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

  openProfileHeader() {
    const ref = this.dialog.open(Profile, {
      panelClass: 'profile-dialog-panel',
      ...(this.isMobile ? {} : { position: { top: '120px', right: '20px' } }),
    });

    ref.afterClosed().subscribe((updatedName?: string) => {
      if (updatedName) {
        this.userName = updatedName;
        this.cdr.detectChanges();
      }
    });
  }
}

