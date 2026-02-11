import { Injectable, inject } from '@angular/core';
import {
    Firestore, collection, doc, query, orderBy, onSnapshot,
    serverTimestamp, writeBatch, runTransaction, getDoc, updateDoc
} from '@angular/fire/firestore';
import { MessageDoc, ReactionUserDoc, FirestoreUnsubscribtion, toDate } from './messages.types';

@Injectable({ providedIn: 'root' })
export class DmMessagesStore {
    private firestore = inject(Firestore);

    // Collection: users/{uid}/messages/directMessages/{dmId}
    private dmMsgsCol(uid: string, dmId: string) {
        return collection(this.firestore, `users/${uid}/messages/directMessages/${dmId}`);
    }

    // Doc: users/{uid}/messages/directMessages/{dmId}/{messageId}
    private dmMsgDoc(uid: string, dmId: string, messageId: string) {
        return doc(this.firestore, `users/${uid}/messages/directMessages/${dmId}/${messageId}`);
    }

    private buildDmId(aUid: string, bUid: string): string {
        return [aUid, bUid].sort().join('__');
    }

    getDmId(aUid: string, bUid: string): string {
        return this.buildDmId(aUid, bUid);
    }

    listenDirectMessages(
        uid: string,
        dmId: string,
        cb: (msgs: (MessageDoc & { id: string })[]) => void
    ): FirestoreUnsubscribtion {
        const qy = query(this.dmMsgsCol(uid, dmId), orderBy('createdAt', 'asc'));
        return onSnapshot(qy, snap => {
            const out = snap.docs.map(d => {
                const data = d.data() as MessageDoc;
                return {
                    ...data,
                    id: d.id,
                    createdAt: toDate(data.createdAt),
                    lastReplyTime: data.lastReplyTime ? toDate(data.lastReplyTime) : undefined
                };
            });
            cb(out);
        });
    }

    listenSelfDirectMessages(
        uid: string,
        cb: (msgs: (MessageDoc & { id: string })[]) => void
    ) {
        return this.listenDirectMessages(uid, 'self', cb);
    }

    async sendSelfDirectMessage(
        uid: string,
        params: {
            text: string;
            author: {
                uid: string;
                username: string;
                avatar: string
            }
        }
    ) {
        return this.send(uid, uid, params, true);
    }

    async sendDirectMessageBetween(
        aUid: string,
        bUid: string,
        params: {
            text: string;
            author: {
                uid: string;
                username: string;
                avatar: string
            }
        }
    ) {
        return this.send(aUid, bUid, params, false);
    }

    async updateSelfDirectMessage(
        uid: string,
        messageId: string,
        text: string
    ) {
        await updateDoc(this.dmMsgDoc(uid, 'self', messageId), { text });
    }

    async updateDirectMessageBetween(
        aUid: string,
        bUid: string,
        messageId: string,
        text: string
    ) {
        const dmId = this.buildDmId(aUid, bUid);
        const batch = writeBatch(this.firestore);
        batch.update(this.dmMsgDoc(aUid, dmId, messageId), { text });
        batch.update(this.dmMsgDoc(bUid, dmId, messageId), { text });
        await batch.commit();
    }

    async toggleSelfDirectMessageReaction(
        uid: string,
        messageId: string,
        emojiId: string,
        you: ReactionUserDoc
    ) {
        await this.toggleDirectMessageReaction(uid, 'self', messageId, emojiId, you);
    }

    async toggleDirectMessageReactionBetween(
        aUid: string,
        bUid: string,
        messageId: string,
        emojiId: string,
        you: ReactionUserDoc
    ) {
        const dmId = this.buildDmId(aUid, bUid);

        await this.toggleDirectMessageReaction(aUid, dmId, messageId, emojiId, you);

        const aRef = this.dmMsgDoc(aUid, dmId, messageId);
        const aSnap = await getDoc(aRef);
        if (!aSnap.exists()) return;

        const data = aSnap.data() as MessageDoc;
        await updateDoc(this.dmMsgDoc(bUid, dmId, messageId), { reactions: data.reactions });
    }

    // -------- internals --------

    private async send(aUid: string, bUid: string, params: { text: string; author: any }, isSelf: boolean) {
        const dmId = isSelf ? 'self' : this.buildDmId(aUid, bUid);
        const id = doc(this.dmMsgsCol(aUid, dmId)).id;

        const payload: MessageDoc = {
            text: params.text,
            createdAt: serverTimestamp(),
            author: params.author,
            reactions: [],
            repliesCount: 0,
            lastReplyTime: null
        };

        const batch = writeBatch(this.firestore);
        batch.set(this.dmMsgDoc(aUid, dmId, id), payload, { merge: false });
        if (!isSelf) batch.set(this.dmMsgDoc(bUid, dmId, id), payload, { merge: false });
        await batch.commit();

        return id;
    }

    private async toggleDirectMessageReaction(
        uid: string,
        dmId: string,
        messageId: string,
        emojiId: string,
        you: ReactionUserDoc
    ) {
        const ref = this.dmMsgDoc(uid, dmId, messageId);

        await runTransaction(this.firestore, async tx => {
            const snap = await tx.get(ref);
            if (!snap.exists()) return;

            const data = snap.data() as MessageDoc;
            data.reactions ||= [];

            const idx = data.reactions.findIndex(r => r.emojiId === emojiId);
            if (idx >= 0) {
                const rx = data.reactions[idx];
                const youIdx = rx.reactionUsers.findIndex(u => u.userId === you.userId);

                if (youIdx >= 0) {
                    rx.reactionUsers.splice(youIdx, 1);
                    rx.emojiCount = Math.max(0, rx.emojiCount - 1);
                    if (rx.emojiCount === 0 || rx.reactionUsers.length === 0) data.reactions.splice(idx, 1);
                } else {
                    rx.reactionUsers.push(you);
                    rx.emojiCount += 1;
                }
            } else {
                data.reactions.push({ emojiId, emojiCount: 1, reactionUsers: [you] });
            }

            tx.update(ref, { reactions: data.reactions });
        });
    }
  
    listenDirectMessagesBetween(
        aUid: string,
        bUid: string,
        cb: (msgs: (MessageDoc & { id: string })[]) => void
    ): FirestoreUnsubscribtion {
        const dmId = this.getDmId(aUid, bUid);
        return this.listenDirectMessages(aUid, dmId, cb);
    }
}