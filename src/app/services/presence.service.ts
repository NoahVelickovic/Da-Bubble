import { Injectable, OnDestroy } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Database, ref, onDisconnect, set } from '@angular/fire/database';

@Injectable({ providedIn: 'root' })
export class PresenceService implements OnDestroy {

  constructor(private auth: Auth, private db: Database) {
    this.initPresence();
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
    });
  }

  ngOnDestroy() {}
}