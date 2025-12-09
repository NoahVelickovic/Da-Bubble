import { Injectable, signal, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { getDocs, query, limit, orderBy, collection, doc, Firestore } from '@angular/fire/firestore';


@Injectable({
  providedIn: 'root'
})
export class ChannelStateService {
  // 🔹 aktuell ausgewählter Channel
  private selectedChannelSubject = new BehaviorSubject<any>(null);
  selectedChannel$ = this.selectedChannelSubject.asObservable();
  firestore: Firestore = inject(Firestore);

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

  async loadFirstAvailableChannel(): Promise<void> {
  try {
    const storedUser = localStorage.getItem('currentUser');
    if (!storedUser) return;
    const uid = JSON.parse(storedUser).uid;

    const userRef = doc(this.firestore, 'users', uid);
    const membershipsRef = collection(userRef, 'memberships');
    
    // Ersten Channel laden (sortiert nach Namen oder Erstelldatum)
    const q = query(membershipsRef, orderBy('name'), limit(1));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const firstChannel = {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data()
      };
      this.selectChannel(firstChannel);
    } else {
      // Falls keine Channels mehr vorhanden sind
      this.selectChannel(null);
    }
  } catch (error) {
    console.error('Fehler beim Laden des ersten Channels:', error);
  }
}
}
