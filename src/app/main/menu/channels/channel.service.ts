import { Injectable, signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChannelStateService {
  // 🔹 aktuell ausgewählter Channel
  private selectedChannelSubject = new BehaviorSubject<any>(null);
  selectedChannel$ = this.selectedChannelSubject.asObservable();

  // 🔹 Liste aller Channels als Signal
  private _channels = signal<any[]>([]);
  private _channelsSubject = new BehaviorSubject<any[]>([]);
  channels$ = this._channelsSubject.asObservable();

  selectChannel(channel: any) {
    this.selectedChannelSubject.next(channel);
  }

  getCurrentChannel() {
    return this.selectedChannelSubject.value;
  }

  setChannels(channels: any[]) {
    this._channels.set(channels);
    this._channelsSubject.next(channels); // 🔹 Observable aktualisieren
  }

  removeChannel(channelId: string) {
    const updated = this._channels().filter(c => c.id !== channelId);
    this._channels.set(updated);
    this._channelsSubject.next(updated); // 🔹 Observable aktualisieren

    // 🔹 Wenn der aktuell ausgewählte Channel entfernt wird
    if (this.getCurrentChannel()?.id === channelId) {
      this.selectedChannelSubject.next(null);
    }
  }
}
