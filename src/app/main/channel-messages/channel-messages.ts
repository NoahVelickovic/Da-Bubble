import { Component } from '@angular/core';
import { ChannelMessagesHeader } from './channel-messages-header/channel-messages-header';
import { ThreadChannelMessages } from './thread-channel-messages/thread-channel-messages';

@Component({
  selector: 'app-channel-messages',
  imports: [ChannelMessagesHeader, ThreadChannelMessages],
  templateUrl: './channel-messages.html',
  styleUrl: './channel-messages.scss',
})
export class ChannelMessages {

}