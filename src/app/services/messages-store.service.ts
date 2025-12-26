import { Injectable, inject } from '@angular/core';
import {
    Firestore, collection, doc, addDoc, serverTimestamp,
    query, orderBy, onSnapshot, runTransaction, writeBatch, getDoc, updateDoc
} from '@angular/fire/firestore';
import { Timestamp, Unsubscribe } from '@angular/fire/firestore';

export type MessageDoc = {
    text: string;
    createdAt: any;
    author: { uid: string; username: string; avatar: string };
    reactions: ReactionDoc[];
    repliesCount: number;
    lastReplyTime?: any | null;
};

export type ReactionDoc = {
    emojiId: string;
    emojiCount: number;
    reactionUsers: ReactionUserDoc[];
    youReacted?: boolean;
};

export type ReactionUserDoc = {
    userId: string;
    username: string;
};

@Injectable({ providedIn: 'root' })
export class MessagesStoreService {
    private firestore = inject(Firestore);

    // Collection: users/{uid}/messages/channels/{channelId}
    private channelMsgsCol(uid: string, channelId: string) {
        return collection(this.firestore, `users/${uid}/messages/channels/${channelId}`);
    }

    // Doc: users/{uid}/messages/channels/{channelId}/{messageId}
    private channelMsgDoc(uid: string, channelId: string, messageId: string) {
        return doc(this.firestore, `users/${uid}/messages/channels/${channelId}/${messageId}`);
    }

    // Collection: users/{uid}/messages/directMessages/{dmId}
    private dmMsgsCol(uid: string, dmId: string) {
        return collection(this.firestore, `users/${uid}/messages/directMessages/${dmId}`);
    }

    // Doc: users/{uid}/messages/directMessages/{dmId}/{messageId}
    private dmMsgDoc(uid: string, dmId: string, messageId: string) {
        return doc(this.firestore, `users/${uid}/messages/directMessages/${dmId}/${messageId}`);
    }




    private async getChannelMemberUids(ownerUid: string, channelId: string): Promise<string[]> {
        const membershipRef = doc(this.firestore, `users/${ownerUid}/memberships/${channelId}`);
        const snap = await getDoc(membershipRef);
        const members = (snap.exists() ? (snap.data() as any)?.members : []) || [];
        const uids = members
            .map((m: any) => m?.uid || m?.id)
            .filter((x: string) => !!x);

        if (!uids.includes(ownerUid)) uids.push(ownerUid);

        return Array.from(new Set(uids));
    }




    listenChannelMessages(
        uid: string,
        channelId: string,
        cb: (msgs: (MessageDoc & { id: string })[]) => void
    ): Unsubscribe {
        const qy = query(this.channelMsgsCol(uid, channelId), orderBy('createdAt', 'asc'));
        return onSnapshot(qy, snap => {
            const out = snap.docs.map(d => {
                const data = d.data() as MessageDoc;
                return {
                    ...data,
                    id: d.id,
                    createdAt: this.toDate(data.createdAt),
                    lastReplyTime: data.lastReplyTime ? this.toDate(data.lastReplyTime) : undefined
                };
            });
            cb(out);
        });
    }

    listenDirectMessages(
        uid: string,
        dmId: string,
        cb: (msgs: (MessageDoc & { id: string })[]) => void
    ): Unsubscribe {
        const qy = query(this.dmMsgsCol(uid, dmId), orderBy('createdAt', 'asc'));
        return onSnapshot(qy, snap => {
            const out = snap.docs.map(d => {
                const data = d.data() as MessageDoc;
                return {
                    ...data,
                    id: d.id,
                    createdAt: this.toDate(data.createdAt),
                    lastReplyTime: data.lastReplyTime ? this.toDate(data.lastReplyTime) : undefined
                };
            });
            cb(out);
        });
    }

    async sendChannelMessage(
        uid: string,
        channelId: string,
        params: { text: string; author: { uid: string; username: string; avatar: string } }
    ) {
        const memberUids = await this.getChannelMemberUids(uid, channelId);

        const id = doc(this.channelMsgsCol(uid, channelId)).id;

        const payload: MessageDoc = {
            text: params.text,
            createdAt: serverTimestamp(),
            author: params.author,
            reactions: [],
            repliesCount: 0,
            lastReplyTime: null
        };

        const MAX = 500;
        let batch = writeBatch(this.firestore);
        let count = 0;

        for (const uid of memberUids) {
            const ref = this.channelMsgDoc(uid, channelId, id);
            batch.set(ref, payload, { merge: false });
            if (++count >= MAX) { await batch.commit(); batch = writeBatch(this.firestore); count = 0; }
        }
        if (count) await batch.commit();

        return id;

        /*
        await addDoc(this.channelMsgsCol(uid, channelId), {
            text: params.text,
            createdAt: serverTimestamp(),
            author: params.author,
            reactions: [],
            repliesCount: 0,
            lastReplyTime: null
        } satisfies MessageDoc);
        */
    }

    async updateChannelMessage(uid: string, channelId: string, messageId: string, text: string) {
        const memberUids = await this.getChannelMemberUids(uid, channelId);

        const MAX = 500;
        let batch = writeBatch(this.firestore);
        let count = 0;

        for (const uid of memberUids) {
            const ref = this.channelMsgDoc(uid, channelId, messageId);
            batch.update(ref, { text: text });
            if (++count >= MAX) { await batch.commit(); batch = writeBatch(this.firestore); count = 0; }
        }
        if (count) await batch.commit();


        /*
        const ref = this.channelMsgDoc(uid, channelId, messageId);
        await updateDoc(ref, {
            text,
            // optional, wenn du "bearbeitet" anzeigen willst:
            // editedAt: serverTimestamp(),
            // edited: true,
        });
        */
    }


    async toggleChannelReaction(uid: string, channelId: string, messageId: string, emojiId: string, you: ReactionUserDoc) {
        const memberUids = await this.getChannelMemberUids(uid, channelId);

        let nextReactions: ReactionDoc[] = [];

        await runTransaction(this.firestore, async tx => {
            const ownerRef = this.channelMsgDoc(uid, channelId, messageId);
            const snap = await tx.get(ownerRef);
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
                    if (rx.emojiCount === 0 || rx.reactionUsers.length === 0) {
                        data.reactions.splice(idx, 1);
                    }
                } else {
                    rx.reactionUsers.push(you);
                    rx.emojiCount += 1;
                }
            } else {
                data.reactions.push({ emojiId, emojiCount: 1, reactionUsers: [you] });
            }

            nextReactions = data.reactions;

            tx.update(ownerRef, { reactions: nextReactions });
        });

        const MAX = 500;
        let batch = writeBatch(this.firestore);
        let count = 0;

        for (const uid of memberUids) {
            const ref = this.channelMsgDoc(uid, channelId, messageId);
            batch.set(ref, { reactions: nextReactions }, { merge: true });
            if (++count >= MAX) { await batch.commit(); batch = writeBatch(this.firestore); count = 0; }
        }
        if (count) await batch.commit();

        /*
        // const ref = this.channelMsgDoc(uid, channelId, messageId);
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
                    if (rx.emojiCount === 0 || rx.reactionUsers.length === 0) {
                        data.reactions.splice(idx, 1);
                    }
                } else {
                    rx.reactionUsers.push(you);
                    rx.emojiCount += 1;
                }
            } else {
                data.reactions.push({ emojiId, emojiCount: 1, reactionUsers: [you] });
            }
            tx.update(ref, { reactions: data.reactions });
        });
        */
    }



    async sendDirectMessage(
        uid: string,
        dmId: string,
        params: { text: string; author: { uid: string; username: string; avatar: string } }
    ) {
        await addDoc(this.dmMsgsCol(uid, dmId), {
            text: params.text,
            createdAt: serverTimestamp(),
            author: params.author,
            reactions: [],
            repliesCount: 0,
            lastReplyTime: null
        } satisfies MessageDoc);
    }



    async toggleDirectReaction(
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
                    if (rx.emojiCount === 0 || rx.reactionUsers.length === 0) {
                        data.reactions.splice(idx, 1);
                    }
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

    private toDate(x: any): Date {
        if (x instanceof Date) return x;
        if (x && typeof x.toDate === 'function') return (x as Timestamp).toDate();
        return new Date(x);
    }
}