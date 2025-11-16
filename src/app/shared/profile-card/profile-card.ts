import { Component, inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-profile-card',
  imports: [],
  templateUrl: './profile-card.html',
  styleUrl: './profile-card.scss',
})
export class ProfileCard {
  dialogRef = inject(MatDialogRef<ProfileCard>);
  private dialog = inject(MatDialog);

  close() {
    this.dialogRef.close();
  }

}
