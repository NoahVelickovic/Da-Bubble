import { Component, inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { FormsModule, NgForm } from '@angular/forms';






@Component({
  selector: 'app-edit-profile',
  imports: [FormsModule],
  templateUrl: './edit-profile.html',
  styleUrls: ['./edit-profile.scss', 'edit-profile.responsive.scss'],
})
export class EditProfile {


  dialogRef = inject(MatDialogRef<EditProfile>);


  close() {
    this.dialogRef.close();
  }

  save(channelForm: NgForm) {
    let nameInput = channelForm.value.nameInputEdit;



    console.log('gespeichert', nameInput);



    this.close()
  }
}

