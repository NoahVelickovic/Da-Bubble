import { Component, inject } from '@angular/core';
import {MatMenuModule} from '@angular/material/menu';
import { Profile } from './profile/profile';
import { MatDialog } from '@angular/material/dialog';


@Component({
  selector: 'app-header',
  imports: [MatMenuModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
 private dialog = inject(MatDialog);


openDialog() {
    this.dialog.open(Profile);
  }
}
