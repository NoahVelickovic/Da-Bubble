import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from "./main/header/header";
import { Menu } from "./main/menu/menu";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Menu],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('Da-Bubble');
}
