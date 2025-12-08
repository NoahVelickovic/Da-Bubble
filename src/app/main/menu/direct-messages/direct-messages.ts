import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { directMessageContact } from './direct-messages.model';
import { FirebaseService } from '../../../services/firebase';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Firestore, getDoc, doc } from '@angular/fire/firestore';
import { DirectChatService } from '../../../services/direct-chat-service';

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
  
  userName: string = '';
  userAvatar: string = '';
  selectedDmId: string = '';
  isYouSelected: boolean = false;
  
  directMessage$: Observable<directMessageContact[]> | undefined;

  constructor(
    private firebaseService: FirebaseService,
    public router: Router
  ) { }

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

    const userRef = doc(this.firestore, 'direct', uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data: any = snap.data();
      this.userName = data.name;
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