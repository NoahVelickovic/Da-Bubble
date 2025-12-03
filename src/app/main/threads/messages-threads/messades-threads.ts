import { Component, ElementRef, HostListener, inject, AfterViewInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { AddEmojis } from '../add-emojis/add-emojis';
import { AtMembers } from '../at-members/at-members';

type Reply = {
  id: string;
  author: string;
  time: string;
  avatar?: string;
  text: string;
  reactions?: Reaction[];
  isYou?: boolean;
};

type ReactionUser = {
  uid: string;
  name: string;
};

type Reaction = {
  emoji: string;
  count: number;
  youReacted?: boolean;
  users: ReactionUser[];
};

type ReactionPanelState = {
  show: boolean;
  x: number;
  y: number;
  emoji: string;
  title: string;
  subtitle: string;
  messageId?: string;
};

@Component({
  selector: 'app-messades-threads',
  imports: [CommonModule, FormsModule,],
  templateUrl: './messades-threads.html',
  styleUrls: ['./messades-threads.scss'],
})
export class MessadesThreads implements AfterViewInit {
  @ViewChild('scrollArea') scrollArea!: ElementRef<HTMLDivElement>

  ngAfterViewInit() {
    queueMicrotask(() => this.scrollToBottom());
  }

  private dialog = inject(MatDialog)
  private hideTimer: any = null;
  private editHideTimer: any = null;
  private host = inject(ElementRef<HTMLElement>);

  reactionPanel: ReactionPanelState = {
    show: false,
    x: 0,
    y: 0,
    emoji: '',
    title: '',
    subtitle: '',
    messageId: ''
  };

  editForId: string | null = null;

  channel = 'Entwicklerteam';
  currentUserId = 'u_oliver';
  currentUserName = 'Oliver Plit';

  root = {
    author: 'Noah Braun',
    time: '14:25 Uhr',
    avatar: 'icons/avatars/avatar3.png',
    text: 'Welche Version ist aktuell von Angular?',
    isYou: false,
  };

  replies: Reply[] = [
    {
      id: 'r1',
      author: 'Sofia Müller',
      time: '14:30 Uhr',
      avatar: 'icons/avatars/avatar5.png',
      text:
        'Ich habe die gleiche Frage. Ich habe gegoogelt und es scheint, dass die aktuelle Version Angular 13 ist. ' +
        'Vielleicht weiß Frederik, ob es wahr ist.',
      reactions: [
        {
          emoji: 'icons/emojis/emoji_rocket.png',
          count: 1,
          youReacted: true,
          users: [
            { uid: 'u_sofia', name: 'Sofia Müller' },
            { uid: 'u_oliver', name: 'Oliver Plit' },
          ]
        },
        { emoji: 'icons/emojis/emoji_nerd face.png',
          count: 1,
          youReacted: false,
          users: [
            { uid: 'u_sofia', name: 'Sofia Müller' },
            { uid: 'u_oliver', name: 'Oliver Plit' },
          ]
        }
      ],
      isYou: true,
    },
    {
      id: 'r2',
      author: 'Frederik Beck',
      time: '15:06 Uhr',
      avatar: 'icons/avatars/avatar6.png',
      text: 'Ja das ist es.',
      reactions: [
        {
          emoji: 'icons/emojis/emoji_rocket.png',
          count: 1,
          youReacted: true,
          users: [
            { uid: 'u_sofia', name: 'Sofia Müller' },
            { uid: 'u_oliver', name: 'Oliver Plit' },
          ]
        },
        { emoji: 'icons/emojis/emoji_nerd face.png',
          count: 1,
          youReacted: false,
          users: [
            { uid: 'u_sofia', name: 'Sofia Müller' },
            { uid: 'u_oliver', name: 'Oliver Plit' },
          ]
        }
      ],
      isYou: false,
    },
    {
      id: 'r3',
      author: 'Emily Mustermann',
      time: '15:06 Uhr',
      avatar: 'icons/avatars/avatar6.png',
      text: 'Ja das ist es.',
      reactions: [
        {
          emoji: 'icons/emojis/emoji_rocket.png',
          count: 1,
          youReacted: true,
          users: [
            { uid: 'u_sofia', name: 'Sofia Müller' },
            { uid: 'u_oliver', name: 'Oliver Plit' },
          ]
        },
        { emoji: 'icons/emojis/emoji_nerd face.png',
          count: 1,
          youReacted: false,
          users: [
            { uid: 'u_sofia', name: 'Sofia Müller' },
            { uid: 'u_oliver', name: 'Oliver Plit' },
          ]
        }
      ],
      isYou: false
    },
  ];

  draft = '';






  

  openAddEmojis(trigger: HTMLElement) {
    const r = trigger.getBoundingClientRect();
    const gap = 24;
    const dlgW = 350;
    const dlgH = 467;

    this.dialog.open(AddEmojis, {
      width: dlgW + 'px',
      panelClass: 'add-emojis-dialog-panel',
      position: {
        bottom: `${dlgH + gap}px`,
        left: `${64 + dlgW}px`
      }
    });
  }

  openAtMembers(trigger: HTMLElement) {
    const r = trigger.getBoundingClientRect();
    const gap = 24;
    const dlgW = 350;
    const dlgH = 467;

    this.dialog.open(AtMembers, {
      width: dlgW + 'px',
      panelClass: 'at-members-dialog-panel',
      position: {
        bottom: `${-160 + dlgH + gap}px`,
        right: `${-240 + dlgW}px`
      }
    });
  }

  sendMessage() {
    if (!this.draft.trim()) return;
    this.replies.push({
      id: crypto.randomUUID(),
      author: 'Oliver Plit',
      time: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr',
      text: this.draft.trim(),
      isYou: true,
      reactions: [],
    });
    this.draft = '';
  }

  showReactionPanel(reply: Reply, r: Reaction, event: MouseEvent) {
    const element = event.currentTarget as HTMLElement;

    const messageElement = element.closest('.message') as HTMLElement;
    if (!messageElement) return;

    const reactionRect = element.getBoundingClientRect();
    const messageRect = messageElement.getBoundingClientRect();

    const x = reactionRect.left - messageRect.left + 40;
    const y = reactionRect.top - messageRect.top - 110;

    const youReacted = r.users.some(u => u.uid === this.currentUserId);
    const names = r.users.map(u => u.name);

    let title = '';
    if (youReacted && names.length > 0) {
      const otherUsers = names.filter(name => name !== this.currentUserName);
      if (otherUsers.length > 0) {
        title = `${otherUsers.slice(0, 2).join(' und ')} und Du`;
      } else {
        title = 'Du';
      }
    } else if (names.length > 0) {
      title = names.slice(0, 2).join(' und ');
    } else {
      title = '';
    }

    const subtitle = r.users?.length > 1 ? 'haben reagiert' : 'hat reagiert';

    this.reactionPanel = {
      show: true,
      x: Math.max(10, x),
      y: Math.max(10, y),
      emoji: r.emoji,
      title,
      subtitle,
      messageId: reply.id
    };
  }

  clearReactionPanelHide() {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
  }

  scheduleReactionPanelHide(delay = 120) {
    this.clearReactionPanelHide();
    this.hideTimer = setTimeout(() => {
      this.reactionPanel.show = false;
      this.reactionPanel.messageId = '';
    }, delay);
  }

  cancelReactionPanelHide() {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
  }

  toggleEditMessagePanel(reply: Reply, ev: MouseEvent) {
    ev.stopPropagation();
    this.clearEditMessagePanelHide();
    this.editForId = this.editForId === reply.id ? null : reply.id;
  }

  scheduleEditMessagePanelHide(reply: Reply) {
    if (this.editForId !== reply.id) return;
    this.clearEditMessagePanelHide();
    this.editHideTimer = setTimeout(() => {
      this.editForId = null;
    });
  }

  cancelEditMessagePanelHide(_: Reply) {
    this.clearEditMessagePanelHide();
  }

  private clearEditMessagePanelHide() {
    if (this.editHideTimer) {
      clearTimeout(this.editHideTimer);
      this.editHideTimer = null;
    }
  }

  editMessage(ev: MouseEvent) {
    ev.stopPropagation();
    this.editForId = null;
  }

  @HostListener('document:click', ['$event'])
  closeOnOutsideClick(ev: MouseEvent) {
    if (!this.host.nativeElement.contains(ev.target as Node)) {
      this.editForId = null;
    }
  }

  @HostListener('document:keydown.escape')
  closeOnEsc() {
    this.editForId = null;
  }

  private scrollToBottom() {
    const el = this.scrollArea?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }

}
