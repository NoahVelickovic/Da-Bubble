import { Component, inject, } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormsModule, NgForm } from '@angular/forms';
import { Firestore, doc, updateDoc } from '@angular/fire/firestore';
import { ChangeDetectorRef } from '@angular/core';
import { FirebaseService } from '../../../../services/firebase';






@Component({
  selector: 'app-edit-profile',
  imports: [FormsModule],
  templateUrl: './edit-profile.html',
  styleUrls: ['./edit-profile.scss', 'edit-profile.responsive.scss'],
})
export class EditProfile {
  private firestore = inject(Firestore);
  data = inject(MAT_DIALOG_DATA);
  nameInput: string = this.data.name;
  dialogRef = inject(MatDialogRef<EditProfile>);
  constructor(private cd: ChangeDetectorRef, private firebase: FirebaseService) { }


  close() {
    this.dialogRef.close();
  }

  async save(channelForm: NgForm) {
    const newName = this.nameInput.trim();
    if (!newName) return;

    const uid = this.data.uid;
    
    try {
      // 🔥 BEIDE Collections aktualisieren!
      
      // 1. Update in 'users' Collection
      const userRef = doc(this.firestore, 'users', uid);
      await updateDoc(userRef, { name: newName });
      
      // 2. Update in 'directMessages' Collection 🔥 DAS WAR DAS FEHLENDE STÜCK!
      const dmRef = doc(this.firestore, 'directMessages', uid);
      await updateDoc(dmRef, { name: newName });
      
      // 3. FirebaseService aktualisieren (für currentName$ Observable)
      this.firebase.setName(newName);
      
      this.cd.detectChanges();
      this.dialogRef.close(newName);
      
    } catch (error) {
      console.error('❌ Fehler beim Speichern des Namens:', error);
    }
  }
}

