import { Injectable, signal, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { getDocs, query, limit, orderBy, collection, doc, Firestore, getDoc } from '@angular/fire/firestore';


@Injectable({
  providedIn: 'root'
})
export class ChannelStateService {
  private selectedChannelSubject = new BehaviorSubject<any>(null);
  selectedChannel$ = this.selectedChannelSubject.asObservable();
  firestore: Firestore = inject(Firestore);
  private _channels = signal<any[]>([]);
  private _channelsSubject = new BehaviorSubject<any[]>([]);
  channels$ = this._channelsSubject.asObservable();

  selectChannel(channel: any) {
    this.selectedChannelSubject.next(channel);
  }


 updateSelectedChannel(channelData: any) {
    const currentChannel = this.selectedChannelSubject.value;
    
    // Nur aktualisieren wenn es der gleiche Channel ist
    if (currentChannel && currentChannel.id === channelData.id) {
      this.selectedChannelSubject.next(channelData);
    }
  }


  getCurrentChannel() {
    return this.selectedChannelSubject.value;
  }

  setChannels(channels: any[]) {
    this._channels.set(channels);
    this._channelsSubject.next(channels);
  }

  async loadFullChannel(channelId: string) {
  const firestore = this.firestore;
  const ref = doc(firestore, `channels/${channelId}`);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  const data = snap.data();

  return {
    id: channelId,
    ...data,
    members: Array.isArray(data['members']) ? data['members'] : [],
  };
}

  removeChannel(channelId: string) {
    const updated = this._channels().filter(c => c.id !== channelId);
    this._channels.set(updated);
    this._channelsSubject.next(updated); 

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
    
    const q = query(membershipsRef, orderBy('name'), limit(1));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const firstChannel = {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data()
      };
      this.selectChannel(firstChannel);
    } else {
      this.selectChannel(null);
    }
  } catch (error) {
    console.error('Fehler beim Laden des ersten Channels:', error);
  }
}
}
