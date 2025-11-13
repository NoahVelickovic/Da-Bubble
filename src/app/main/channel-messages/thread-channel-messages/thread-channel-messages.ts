import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AddEmojis } from '../add-emojis/add-emojis';
import { AtMembers } from '../at-members/at-members';
import { MatDialog } from '@angular/material/dialog';

type Message = {
  id: string;
  author: string;
  time: string;
  avatar?: string;
  text: string;
  reactions?: Reaction[];
  isYou?: boolean;
  timeSeparator?: string;
};
type Reaction = {
  countAnsweres: number;
  isAnswered?: boolean;
  time: string,
  emoji: string;
  count: number;
  youReacted?: boolean
};

@Component({
  selector: 'app-thread-channel-messages',
  imports: [CommonModule, FormsModule],
  templateUrl: './thread-channel-messages.html',
  styleUrl: './thread-channel-messages.scss',
})
export class ThreadChannelMessages {
  channelName = 'Entwicklerteam';

  membersPreview = [
    { name: 'Noah Braun' },
    { name: 'Sofia Müller' },
    { name: 'Frederik Beck' },
    { name: 'Elise Roth' },
    { name: 'Elias Neumann' },
  ];

  draft = '';

  messages: Message[] = [
    { id: 'd1', timeSeparator: 'Dienstag, 14 Januar', author: '', time: '', text: '' },
    {
      id: 'm1',
      author: 'Noah Braun',
      time: '14:25 Uhr',
      avatar: 'icons/avatars/avatar3.png',
      text: 'Welche Version ist aktuell von Angular?',
      reactions: [],
      isYou: false,
    },
    { id: 'd2', timeSeparator: 'Heute', author: '', time: '', text: '' },
    {
      id: 'm2',
      author: 'Oliver Plit',
      time: '15:06 Uhr',
      avatar: 'icons/avatars/avatar6.png',
      text:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque blandit odio ' +
        'efficitur lectus vestibulum, quis accumsan ante vulputate. Quisque tristique iaculis ' +
        'erat, eu faucibus lacus iaculis ac.',
      reactions: [
        { countAnsweres: 0, isAnswered: false, time: '15:00', emoji: 'icons/emojis/emoji_rocket.png', count: 1, youReacted: true },
        // { countAnsweres: 0, isAnswered: false, time: '15:00', emoji: 'icons/emojis/emoji_nerd face.png', count: 1, youReacted: false },
        // { countAnsweres: 0, isAnswered: false, time: '15:00', emoji: 'icons/emojis/emoji_person raising both hands in celebration.png', count: 1, youReacted: false },
      ],
      isYou: true,
    },
  ];

  private dialog = inject(MatDialog)

  openAddEmojis() {
    this.dialog.open(AddEmojis, {
      panelClass: 'add-emojis-dialog-panel'
    });
  }

  openAtMembers() {
    this.dialog.open(AtMembers, {
      panelClass: 'at-members-dialog-panel'
    });
  }

  sendMessage() {
    if (!this.draft.trim()) return;
    this.messages.push({
      id: crypto.randomUUID(),
      author: 'Oliver Plit',
      time: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr',
      text: this.draft.trim(),
      isYou: true,
      reactions: [],
    });
    this.draft = '';
  }
}
