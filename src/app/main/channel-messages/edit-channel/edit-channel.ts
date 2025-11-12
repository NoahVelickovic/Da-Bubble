import { Component, inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-edit-channel',
  imports: [CommonModule],
  templateUrl: './edit-channel.html',
  styleUrl: './edit-channel.scss',
})
export class EditChannel {
  dialogRef = inject(MatDialogRef<EditChannel>);
  showInputName = false;
  showInputDescription = false;
  closeName = true;
  closeDescription = true;

  close() {
    this.dialogRef.close();
  }


  toggleEditName() {
    this.showInputName = true;
    this.closeName = false;
  }

  toggleEditDescription() {
    this.showInputDescription = true;
    this.closeDescription = false;

  }

   saveEditName() {
    this.showInputName = false;
    this.closeName = true;
  }

  saveEditDescription() {
    this.showInputDescription = false;
    this.closeDescription = true;

  }


}
