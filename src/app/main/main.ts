import { Component } from '@angular/core';
import { Header } from "./header/header";
import { Menu } from "./menu/menu";

@Component({
  selector: 'app-main',
  imports: [Header, Menu],
  templateUrl: './main.html',
  styleUrl: './main.scss',
})
export class Main {

}
