import { Component, Inject, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export type Emoji = {
  id: string;
  name: string;
  src: string;
};

type DialogData = {
  emojis?: Emoji[];
};

@Component({
  selector: 'app-add-emojis',
  imports: [CommonModule],
  templateUrl: './add-emojis.html',
  styleUrl: './add-emojis.scss',
})
export class AddEmojis {
  private dialogRef = inject(MatDialogRef<AddEmojis, Emoji | null>);

  private fallback: Emoji[] = [
    { id: 'rocket', name: '', src: 'icons/emojis/emoji_rocket.png' },
    { id: 'check', name: '', src: 'icons/emojis/emoji_white heavy check mark.png' },
    { id: 'nerd', name: '', src: 'icons/emojis/emoji_nerd face.png' },
    { id: 'thumbs_up', name: '', src: 'icons/emojis/emoji_person raising both hands in celebration.png' },
  ];

  emojis = signal<Emoji[]>(this.fallback);

  constructor(@Inject(MAT_DIALOG_DATA) public data: DialogData | null) {
    if (data?.emojis?.length) this.emojis.set(data.emojis);
  }

  choose(e: Emoji) {
    this.dialogRef.close(e);
  }

  close() {
    this.dialogRef.close(null);
  }
}