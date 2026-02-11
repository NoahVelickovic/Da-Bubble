import { Injectable, inject } from '@angular/core';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class MembershipStore {
    private firestore = inject(Firestore);

    private membershipDoc(uid: string, channelId: string) {
        return doc(this.firestore, `users/${uid}/memberships/${channelId}`);
    }

    async getMemberUids(uid: string, channelId: string): Promise<string[]> {
        const snap = await getDoc(this.membershipDoc(uid, channelId));

        if (!snap.exists()) return [uid];

        const data: any = snap.data();
        const memberUids: string[] = (data.members ?? [])
            .map((m: any) => m.uid || m.id)
            .filter((x: string) => !!x);

        if (!memberUids.includes(uid)) memberUids.push(uid);

        return Array.from(new Set(memberUids));
    }
}