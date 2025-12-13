import { Injectable, signal, effect } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Database, ref, onDisconnect, set, onValue } from '@angular/fire/database';

@Injectable({ providedIn: 'root' })
export class PresenceService {

  userStatusMap = signal<Record<string, 'online' | 'offline'>>({});

  constructor(private auth: Auth, private db: Database) {
    this.setupPresence();
  }

  private setupPresence() {
    // effect läuft garantiert im Injection Context
    effect(() => {
      this.initPresence();
      this.listenToAllStatuses();
    });
  }

  private initPresence() {
    this.auth.onAuthStateChanged(user => {
      if (!user) return;

      const statusRef = ref(this.db, `status/${user.uid}`);

      set(statusRef, {
        state: 'online',
        lastChanged: Date.now()
      });

      onDisconnect(statusRef).set({
        state: 'offline',
        lastChanged: Date.now()
      });

      console.log('🟢 Presence init für UID:', user.uid);
    });
  }

  private listenToAllStatuses() {
    const statusRef = ref(this.db, 'status');

    onValue(statusRef, snapshot => {
      const raw = snapshot.val() || {};
      const mapped: Record<string, 'online' | 'offline'> = {};

      for (const uid in raw) {
        mapped[uid] = raw[uid]?.state === 'online' ? 'online' : 'offline';
      }

      console.log('🟦 Presence RAW:', raw);
      console.log('🟩 Presence MAPPED:', mapped);

      this.userStatusMap.set(mapped);
    });
  }
}