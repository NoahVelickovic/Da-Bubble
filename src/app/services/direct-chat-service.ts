import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { directMessageContact } from '../main/menu/direct-messages/direct-messages.model';

@Injectable({
  providedIn: 'root',
})
export class DirectChatService {
  // BehaviorSubject für den aktuellen Chat-User
  private chatUserSubject = new BehaviorSubject<directMessageContact | null>(null);

  // Observable, auf das Komponenten subscriben können
  chatUser$ = this.chatUserSubject.asObservable();

  // Methode, um Chat zu öffnen
  openChat(user: directMessageContact) {
    this.chatUserSubject.next(user);
  }
}
