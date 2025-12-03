import { Component } from '@angular/core';
import { Header } from "./header/header";
import { Menu } from "./menu/menu";
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { ChannelMessages } from './channel-messages/channel-messages';
import { Threads } from "./threads/threads";
import { CommonModule } from '@angular/common';
import { DirectMessages } from '../main/menu/direct-messages/direct-messages';
import { ChatDirectMessage } from '../main/menu/chat-direct-message/chat-direct-message';
import { directMessageContact } from '../main/menu/direct-messages/direct-messages.model'; // ← Import hinzufügen



@Component({
  selector: 'app-main',
  imports: [Header, ChatDirectMessage, Menu, ChannelMessages, DirectMessages, Threads, CommonModule, MatButtonModule, MatSidenavModule],
  templateUrl: './main.html',
  styleUrl: './main.scss',
})
export class Main {
  showNewMessages = false;
  showNewMessagesChat = false
  isMenuOpen = true;
  showThreads = false;
  isChannelMessagesVisible = true;
  selectedChatUser: directMessageContact | null = null;


  setChannelMessagesVisible(value: boolean) {
    this.isChannelMessagesVisible = value;
  }

  toggleNewMessage() {
    this.showNewMessages = !this.showNewMessages;
  }

  toggleNewDirectChat(dm: directMessageContact) { // ← Parameter hinzufügen
    console.log('3. Main: Event empfangen!', dm);
    this.selectedChatUser = dm;
    this.showNewMessagesChat = true; // ← Immer auf true setzen
    console.log('4. Main: Chat geöffnet für:', this.selectedChatUser);
  }

  toggleNewDirectChatYou() { // ← Parameter hinzufügen
    console.log('3. Main: Event empfangen!');
    this.showNewMessagesChat = true; // ← Immer auf true setzen
    console.log('4. Main: Chat geöffnet für:', this.selectedChatUser);
  }

  closeNewMessage() {
    this.showNewMessages = false;
  }

  get channelMessagesStyle(): { [key: string]: string } {
    const style: { [key: string]: string } = {};

    const menuWidth = this.isMenuOpen ? 366 : 0;
    const threadsWidth = this.showThreads ? 485 : 0;

    style['width'] = `calc(100% - ${menuWidth + threadsWidth}px)`;

    return style;
  }

  closeDirectChat() {
    this.showNewMessagesChat = false;
  }

}
