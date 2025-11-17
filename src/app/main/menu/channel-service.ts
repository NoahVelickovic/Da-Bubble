import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Channel } from '../menu/channels/channel.model';



@Injectable({
  providedIn: 'root',
})
export class ChannelService {
  private channels = new BehaviorSubject<Channel[]>([]);
  channels$ =  this.channels.asObservable();


  addChannel(channel: Channel) {
    const current = this.channels.value;
  this.channels.next([...current, channel])  }
}
