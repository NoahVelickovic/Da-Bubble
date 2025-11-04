import { Component } from '@angular/core';
import {MatMenuModule} from '@angular/material/menu';

@Component({
  selector: 'app-header',
  imports: [MatMenuModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {

}
