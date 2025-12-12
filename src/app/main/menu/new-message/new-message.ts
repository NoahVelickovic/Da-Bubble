import { Component, inject, EventEmitter, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { AddEmojis } from '../../channel-messages/add-emojis/add-emojis';
import { AtMembers } from '../../channel-messages/at-members/at-members';
import { setDoc, Firestore, doc, updateDoc, arrayUnion, collection, collectionData, getDoc } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-new-message',
  imports: [FormsModule, CommonModule],
  templateUrl: './new-message.html',
  styleUrl: './new-message.scss',
})
export class NewMessage {
  @Output() close = new EventEmitter<void>();
    private dialog = inject(MatDialog)
  firestore: Firestore = inject(Firestore);
   selectedPeople: { uid: string, name: string, avatar: string, email: string }[] = [];
  allPeople: { uid: string, name: string, avatar: string, email: string }[] = [];
  filteredPeople: { uid: string, name: string, avatar: string, email: string }[] = [];
  inputName: string = "";
search = true;

ngOnInit() {
    const dmRef = collection(this.firestore, 'directMessages');

    collectionData(dmRef, { idField: 'uid' })
      .pipe(
        map(users =>
          users.map(u => ({
            uid: u['uid'] as string,
            name: u['name'] as string,
            avatar: u['avatar'] as string,
            email: (u['email'] as string) ?? ''
          }))
        )
      )
      .subscribe(users => {
        this.allPeople = users;
        this.filteredPeople = [];
      });
  }


filterPeople() {
    const value = this.inputName.toLowerCase().trim();

    if (value.length < 1) {
      this.filteredPeople = [];
       this.search = false;
      return;
    }

    this.filteredPeople = this.allPeople
      .filter(u => u.name.toLowerCase().includes(value))
      .filter(u => !this.selectedPeople.some(sp => sp.uid === u.uid));
      this.search = this.filteredPeople.length > 0;
  }

  onInputKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && this.filteredPeople.length > 0) {
      event.preventDefault();
      this.selectPerson(this.filteredPeople[0]);
    }
  }


  selectPerson(person: { uid: string, name: string, avatar: string, email: string }) {
  if (this.selectedPeople.some(p => p.uid === person.uid)) return;

  this.selectedPeople.push(person);

  this.allPeople = this.allPeople.filter(p => p.uid !== person.uid);

  this.inputName = '';
  this.filteredPeople = [];
  this.search = false; // <— DROPDOWN ZU
}
  


  removePerson(person: { uid: string, name: string, avatar: string, email: string }) {
    this.selectedPeople = this.selectedPeople.filter(p => p.uid !== person.uid);
    this.allPeople.push(person);
    this.allPeople.sort((a, b) => a.name.localeCompare(b.name));

    this.filterPeople();
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
}

