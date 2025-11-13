import { Component } from '@angular/core';
import { ThreadsHeader } from "./threads-header/threads-header";
import { MessadesThreads } from "./messages-threads/messades-threads";

@Component({
  selector: 'app-threads',
  imports: [ThreadsHeader, MessadesThreads],
  templateUrl: './threads.html',
  styleUrls: ['./threads.scss'],
})
export class Threads {

}