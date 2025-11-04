import {Component, inject} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatSidenavModule} from '@angular/material/sidenav';
import { AddChannel } from '../menu/add-channel/add-channel';
import { MatDialog } from '@angular/material/dialog';





@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [MatButtonModule, MatSidenavModule],
  templateUrl: './menu.html',
  styleUrl: './menu.scss',
})
export class Menu {
  showFiller = false;
 private dialog = inject(MatDialog);

  openDialog() {
    this.dialog.open(AddChannel, {
      width: '400px',
      panelClass: 'custom-dialog-container' 
    });
  }
}


