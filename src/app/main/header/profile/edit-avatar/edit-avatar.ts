import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { Firestore, doc, writeBatch, getDocs, collection } from '@angular/fire/firestore';
import { ChangeDetectorRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FirebaseService } from '../../../../services/firebase';

@Component({
  selector: 'app-edit-avatar',
  imports: [],
  templateUrl: './edit-avatar.html',
  styleUrl: './edit-avatar.scss',
})
export class EditAvatar {
  private firestore = inject(Firestore);
  data = inject(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef<EditAvatar>);

  selectedAvatar: string = this.data?.avatar || 'avatar1.png';
  currentUserName: string = this.data?.name || localStorage.getItem("currentUserName") || "User";

  constructor(
    private router: Router, 
    private cd: ChangeDetectorRef,
    private firebase: FirebaseService
  ) {}

  selectAvatar(avatar: string) {
    this.selectedAvatar = avatar;
    this.cd.detectChanges(); 
  }

  close() {
    this.dialogRef.close();
  }

  async saveAvatar() {
    const uid = this.data?.uid || localStorage.getItem('currentUser');
    if (!uid) return;

    try {
      const batch = writeBatch(this.firestore);
      
      const userRef = doc(this.firestore, 'users', uid);
      batch.update(userRef, { avatar: this.selectedAvatar });
      
      const dmRef = doc(this.firestore, 'directMessages', uid);
      batch.update(dmRef, { avatar: this.selectedAvatar });
      
      await batch.commit();
      
      await this.updateAvatarInAllChannelMemberships(uid, this.selectedAvatar);

      this.firebase.setAvatar?.(this.selectedAvatar);
      
      this.cd.detectChanges();
      this.dialogRef.close(this.selectedAvatar);
      
    } catch (error) {
      console.error('❌ Fehler beim Speichern des Avatars:', error);
    }
  }

  private async updateAvatarInAllChannelMemberships(uid: string, newAvatar: string) {
    try {
      const usersCol = collection(this.firestore, 'users');
      const usersSnapshot = await getDocs(usersCol);
      
      const updatePromises: Promise<void>[] = [];
      let currentBatch = writeBatch(this.firestore);
      let batchCount = 0;
      const MAX_BATCH_SIZE = 500;

      for (const userDoc of usersSnapshot.docs) {
        const membershipsCol = collection(
          this.firestore,
          `users/${userDoc.id}/memberships`
        );
        const membershipsSnapshot = await getDocs(membershipsCol);

        for (const membershipDoc of membershipsSnapshot.docs) {
          const membershipData = membershipDoc.data();
          const members = membershipData['members'] || [];

          const memberIndex = members.findIndex((m: any) => m.uid === uid);

          if (memberIndex !== -1) {
            const updatedMembers = [...members];
            updatedMembers[memberIndex] = {
              ...updatedMembers[memberIndex],
              avatar: newAvatar
            };

            const membershipRef = doc(
              this.firestore,
              `users/${userDoc.id}/memberships/${membershipDoc.id}`
            );

            currentBatch.update(membershipRef, { members: updatedMembers });
            batchCount++;

            if (batchCount >= MAX_BATCH_SIZE) {
              updatePromises.push(currentBatch.commit());
              currentBatch = writeBatch(this.firestore);
              batchCount = 0;
            }
          }
        }
      }

      if (batchCount > 0) {
        updatePromises.push(currentBatch.commit());
      }

      await Promise.all(updatePromises);
      
    } catch (error) {
      console.error('❌ Fehler beim Aktualisieren der Memberships:', error);
      throw error;
    }
  }

  goBack() {
    localStorage.setItem('skipIntro', 'true');
    this.router.navigate(['/signup']);
  }
}