import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { directMessageContact } from './direct-messages.model';
import { FirebaseService } from '../../../services/firebase';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Firestore, getDoc, doc } from '@angular/fire/firestore';
import { DirectChatService } from '../../../services/direct-chat-service';
import { map } from 'rxjs/operators';
import { PresenceService } from '../../../services/presence.service';

@Component({
  selector: 'app-direct-messages',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './direct-messages.html',
  styleUrl: './direct-messages.scss',
})
export class DirectMessages {
  directMessage: directMessageContact[] = [];
  private firestore = inject(Firestore);
  private cdr = inject(ChangeDetectorRef);
  private directChatService = inject(DirectChatService);
  public presence = inject(PresenceService)

  userName: string = '';
  userAvatar: string = '';
    currentUserId: string = '';

  selectedDmId: string = '';
  isYouSelected: boolean = false;
  
  directMessage$: Observable<directMessageContact[]> | undefined;

  constructor(
    private firebaseService: FirebaseService,
    public router: Router
  ) { }

 async ngOnInit() {
    await this.initUserId();
    
    this.directMessage$ = this.firebaseService.getCollection$('directMessages').pipe(
      map(users => users.filter(user => user.id !== this.currentUserId))
    );
    
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
    
    const userData = JSON.parse(storedUser);
    this.currentUserId = userData.uid;
    
    if (!this.currentUserId) return;

    const userRef = doc(this.firestore, 'directMessages', this.currentUserId);
    const snap = await getDoc(userRef);
    
    if (snap.exists()) {
      const data: any = snap.data();
      this.userName = data.name;
      this.userAvatar = data.avatar || 'avatar-0.png';
      this.firebaseService.setName(this.userName);
      this.cdr.detectChanges();
    }
  }


  openChatDirectMessage(dm: directMessageContact) {
    this.selectedDmId = dm.id;
    this.isYouSelected = false;
    this.directChatService.openChat(dm);
this.router.navigate(['/main/direct-message', dm.name]);   }

  openChatYou() { 
    this.selectedDmId = '';
    this.isYouSelected = true;
    this.router.navigate(['/main/direct-you']);
  }
}