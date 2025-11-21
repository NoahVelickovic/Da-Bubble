import { Injectable, inject } from '@angular/core';
import { Channel } from "../../../main/menu/channels/channel.model";

import {
  Firestore,
  collection,
  getDocs,
  doc,
} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class ChannelStoreService {

  private channels: Channel[] = [];
  private loaded = false;

  private firestore = inject(Firestore);

  constructor() {}

  async loadChannels() {
    if (this.loaded) return;
    const data = await this.getCollectionOnce('channels');
    this.channels = data;
    this.loaded = true;
  }

  getChannelsSync(): Channel[] {
    return this.channels;
  }

  updateChannel(name: string, updates: Partial<Channel>) {
    const channel = this.channels.find(c => c.name === name);
    if (channel) Object.assign(channel, updates);
  }

  async getCollectionOnce(collectionName: string): Promise<any[]> {
    const colRef = collection(this.firestore, collectionName);
    const snapshot = await getDocs(colRef);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }
}
