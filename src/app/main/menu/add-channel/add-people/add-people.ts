import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef } from '@angular/material/dialog';

import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-add-people',
  imports: [CommonModule],
  templateUrl: './add-people.html',
  styleUrl: './add-people.scss',
})
export class AddPeople {
  dialogRef = inject(MatDialogRef<AddPeople>)
  showExtraFields = false;

  toggleExtraField(status: boolean) {
    this.showExtraFields = status;
  }


  closeDialog() {
    this.dialogRef.close();
  }

}
