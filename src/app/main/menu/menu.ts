import {Component} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatSidenavModule} from '@angular/material/sidenav';


@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [MatButtonModule, MatSidenavModule],
  templateUrl: './menu.html',
  styleUrl: './menu.scss',
})
export class Menu {
  showFiller = false;

}
