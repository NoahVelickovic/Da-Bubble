import { Injectable, inject } from '@angular/core';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';

type Member = {
  uid: string;
  name: string;
  avatar?: string;
  email?: string;
  status?: string;
  isYou?: boolean;
};

type Channel = {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  members: Member[];
  createdAt: Date;
  updatedAt: Date;
};

@Injectable({
  providedIn: 'root',
})
export class GlobalChannelService {
  private firestore = inject(Firestore);

  // -----------------------------------------------------
  // 1) Channel immer robust lesen (mit Fallbacks)
  // -----------------------------------------------------
  async getGlobalChannel(channelId: string): Promise<Channel | null> {
    const ref = doc(this.firestore, `channels/${channelId}`);
    const snap = await getDoc(ref);

    if (!snap.exists()) return null;

    const data = snap.data();

    return {
      id: snap.id,
      name: data['name'] ?? '',
      description: data['description'] ?? '',
      createdBy: data['createdBy'] ?? '',
      members: Array.isArray(data['members']) ? data['members'] : [], // 🔥 IMMER Array
      createdAt: data['createdAt'] ?? new Date(),
      updatedAt: data['updatedAt'] ?? new Date()
    };
  }

  // -----------------------------------------------------
  // 2) Sicheres Update – members immer mitführen
  // -----------------------------------------------------
  async updateGlobalChannel(channelId: string, channelData: Partial<Channel>) {
    const existing = await this.getGlobalChannel(channelId);

    const mergedData = {
      ...existing,
      ...channelData,
      members: Array.isArray(channelData.members)
        ? channelData.members
        : existing?.members ?? [],   // 🔥 niemals undefined!
      updatedAt: new Date()
    };

    const ref = doc(this.firestore, `channels/${channelId}`);
    await setDoc(ref, mergedData, { merge: true });

    console.log('✅ Globaler Channel aktualisiert:', channelId);
  }

  // -----------------------------------------------------
  // 3) Members synchronisieren – FEHLERSICHER
  // -----------------------------------------------------
  async syncAllUserMemberships(channelId: string, updatedMembers: Member[] | undefined) {

    // 🔥 Sicherstellen, dass ein Array existiert
    if (!Array.isArray(updatedMembers)) {
      console.warn(`⚠ updatedMembers war undefined – setze []`);
      updatedMembers = [];
    }

    const globalChannel = await this.getGlobalChannel(channelId);
    if (!globalChannel) {
      console.warn(`⚠ Channel ${channelId} nicht gefunden`);
      return;
    }

    // 🔥 Nur EIN globalChannel für alle User, spart Firestore calls
    const payload = {
      channelId,
      name: globalChannel.name,
      description: globalChannel.description,
      createdBy: globalChannel.createdBy,
      members: globalChannel.members // immer Array
    };

    for (const member of updatedMembers) {
      await this.syncUserMembership(member.uid, channelId, payload);
    }

    console.log(`✅ ${updatedMembers.length} Memberships synchronisiert`);
  }

  // -----------------------------------------------------
  // 4) Einzelne Membership robust synchronisieren
  // -----------------------------------------------------
  private async syncUserMembership(uid: string, channelId: string, channel: any) {
    const ref = doc(this.firestore, `users/${uid}/memberships/${channelId}`);

    const snap = await getDoc(ref);
    const joinedAt = snap.exists() ? snap.data()['joinedAt'] : new Date();

    await setDoc(ref, {
      ...channel,
      joinedAt,
      syncedAt: new Date()
    }, { merge: true });
  }

  // -----------------------------------------------------
  // 5) Neue Members hinzufügen – fehlersicher
  // -----------------------------------------------------
  async addMembersToChannel(channelId: string, newMembers: Member[], channelData: Partial<Channel>) {
    let global = await this.getGlobalChannel(channelId);

    if (!global) {
      global = {
        id: channelId,
        name: channelData.name || 'Neuer Channel',
        description: channelData.description || '',
        createdBy: channelData.createdBy || 'Unknown',
        members: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }

    const existingUids = new Set(global.members.map(m => m.uid));
    const uniqueNewMembers = newMembers.filter(m => !existingUids.has(m.uid));

    const updatedMembers = [...global.members, ...uniqueNewMembers];

    await this.updateGlobalChannel(channelId, { members: updatedMembers });

    await this.syncAllUserMemberships(channelId, updatedMembers);

    console.log(`✅ ${uniqueNewMembers.length} neue Members, ${updatedMembers.length} total`);

    return updatedMembers;
  }
}
