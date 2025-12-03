import { Component, EventEmitter, Output, HostListener, inject } from '@angular/core';
import { directMessageContact } from './direct-messages.model';
import { FirebaseService } from '../../../services/firebase';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Firestore, getDoc } from '@angular/fire/firestore';
import { collection, doc } from '@angular/fire/firestore';
import { collectionData } from '@angular/fire/firestore';
import { ChangeDetectorRef } from '@angular/core';






@Component({
  selector: 'app-direct-messages',
  standalone: true,
  imports: [CommonModule,],
  templateUrl: './direct-messages.html',
  styleUrl: './direct-messages.scss',
})
export class DirectMessages {
 @Output() ChatDirectMessage = new EventEmitter<directMessageContact>();
  @Output() ChatDirectYou = new EventEmitter<void>();


  directMessage: directMessageContact[] = [];
  private firestore = inject(Firestore);
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  userName: string = '';
  userAvatar: string = '';
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
    console.log('Klick erkannt'); 
    this.ChatDirectMessage.emit(dm);
  }

   openChatYou() {
    console.log('Klick erkannt'); 
    this.ChatDirectMessage.emit();
  }
}
