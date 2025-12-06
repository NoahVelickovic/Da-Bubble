import { Component, HostListener, ChangeDetectorRef } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatDialog } from '@angular/material/dialog';
import { Channels } from '../menu/channels/channels';
import { DirectMessages } from '../menu/direct-messages/direct-messages';
import { CommonModule } from '@angular/common';
import { AddChannel } from '../menu/add-channel/add-channel';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [MatButtonModule, MatSidenavModule, Channels, DirectMessages, CommonModule],
  templateUrl: './menu.html',
  styleUrls: ['./menu.scss', './menu.responsive.scss'],
})
export class Menu {
  showChannels = true;
  showMessages = false;
  isMenuOpen = false;
  isMobile = false;

  constructor(
    private dialog: MatDialog, 
    private cd: ChangeDetectorRef
  ) {}

  @HostListener('window:resize')
  checkWidth() {
    this.isMobile = window.innerWidth <= 550;
    if (!this.isMobile) {
      this.isMenuOpen = true;
    }
  }

  ngOnInit() {
    this.checkWidth();
  }

  onOpenNewMessage() {
    console.log('Neue Nachricht');
  }

  openDialog() {
    this.dialog.open(AddChannel, {
      panelClass: 'add-channel-dialog-panel'
    });
  }

  toggleChannels() {
    this.showChannels = !this.showChannels;
  }

  toggleMessages() {
    this.showMessages = !this.showMessages;
  }

  onDrawerChange(event: any) {
    this.isMenuOpen = !this.isMenuOpen;
    this.cd.detectChanges();
  }
}