import { Component, inject,HostListener } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatDialog } from '@angular/material/dialog';
import { EditProfile } from './edit-profile/edit-profile';
import { FirebaseService } from '../../../services/firebase';
import { CommonModule } from '@angular/common';




@Component({
  selector: 'app-profile',
  imports: [CommonModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss', './profile.responsive.scss']
})
export class Profile {
   dialogRef = inject(MatDialogRef<Profile>);
 private dialog = inject(MatDialog);
mobileEdit = false;
  constructor(private firebaseService: FirebaseService) { }


   ngOnInit() {
    this.checkWidth();
  }


openDialog() {
this.dialog.open(EditProfile, {
  panelClass: 'edit-profil-dialog-panel',
    position: { top: '120px', right: '20px' }

});  
}
@HostListener('window:resize')
  checkWidth() {
    this.mobileEdit = window.innerWidth <= 550; 
  }


close() {
    this.dialogRef.close();
  }
}
