import { Injectable, inject, NgZone } from '@angular/core';
import {
    Firestore, collection, doc, query, orderBy, onSnapshot,
    serverTimestamp, writeBatch, runTransaction, increment, getDoc, getDocs, updateDoc, limit
} from '@angular/fire/firestore';
import type { Unsubscribe, Timestamp } from '@angular/fire/firestore';

import { MessageDoc, ReactionDoc, ReactionUserDoc, toDate } from './messages.types';

@Injectable({ providedIn: 'root' })
export class DmThreadsStore {
    private firestore = inject(Firestore);
    private zone = inject(NgZone);

    // Collection: users/{uid}/messages/directMessages/{dmId}
    private dmMsgsCol(uid: string, dmId: string) {
        return collection(this.firestore, `users/${uid}/messages/directMessages/${dmId}`);
    }

    // Doc: users/{uid}/messages/directMessages/{dmId}/{messageId}
    private dmMsgDoc(uid: string, dmId: string, messageId: string) {
        return doc(this.firestore, `users/${uid}/messages/directMessages/${dmId}/${messageId}`);
    }

    // Collection: users/${uid}/messages/directMessages/${dmId}/${messageId}/threads
    private dmThreadMsgsCol(uid: string, dmId: string, messageId: string) {
        return collection(this.firestore, `users/${uid}/messages/directMessages/${dmId}/${messageId}/threads`);
    }

    // Doc: users/${uid}/messages/directMessages/${dmId}/${messageId}/threads/${threadMessageId}
    private dmThreadMsgDoc(uid: string, dmId: string, messageId: string, threadMessageId: string) {
        return doc(this.firestore, `users/${uid}/messages/directMessages/${dmId}/${messageId}/threads/${threadMessageId}`);
    }

    private participants(aUid: string, bUid?: string): string[] {
        if (!bUid || aUid === bUid) return [aUid];
        return [aUid, bUid];
    }

    listenThreadMessages(
        uid: string,
        dmId: string,
        messageId: string,
        cb: (msgs: (MessageDoc & { id: string })[]) => void
    ): Unsubscribe {
        const qy = query(this.dmThreadMsgsCol(uid, dmId, messageId), orderBy('createdAt', 'asc'));

        return onSnapshot(qy, snap => {
            this.zone.run(() => {
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
        });
    }

    async sendThreadReply(
        uid: string,
        dmId: string,
        messageId: string,
        params: { text: string; author: { uid: string; username: string; avatar: string } },
        peerUid?: string
    ) {
        return this.sendThreadReplyBetween(uid, peerUid, dmId, messageId, params);
    }

    async updateThreadMessage(
        uid: string,
        dmId: string,
        messageId: string,
        threadMessageId: string,
        text: string,
        peerUid?: string
    ) {
        return this.updateThreadMessageBetween(uid, peerUid, dmId, messageId, threadMessageId, text);
    }

    async sendThreadReplyBetween(
        aUid: string,
        bUid: string | undefined,
        dmId: string,
        messageId: string,
        params: {
            text: string;
            author: {
                uid: string;
                username: string;
                avatar: string
            }
        }
    ) {
        const uids = this.participants(aUid, bUid);
        const threadMessageId = doc(this.dmThreadMsgsCol(aUid, dmId, messageId)).id;

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

        for (const uid of uids) {
            const replyRef = this.dmThreadMsgDoc(uid, dmId, messageId, threadMessageId);
            batch.set(replyRef, payload, { merge: false });

            const rootRef = this.dmMsgDoc(uid, dmId, messageId);
            batch.set(
                rootRef,
                {
                    repliesCount: increment(1),
                    lastReplyTime: serverTimestamp()
                } as any,
                { merge: true }
            );

            if (++count >= MAX) {
                await batch.commit();
                batch = writeBatch(this.firestore);
                count = 0;
            }
        }

        if (count) await batch.commit();
        return threadMessageId;
    }

    async updateThreadMessageBetween(
        aUid: string,
        bUid: string | undefined,
        dmId: string,
        messageId: string,
        threadMessageId: string,
        text: string
    ) {
        const uids = this.participants(aUid, bUid);

        const MAX = 500;
        let batch = writeBatch(this.firestore);
        let count = 0;

        for (const uid of uids) {
            const ref = this.dmThreadMsgDoc(uid, dmId, messageId, threadMessageId);
            batch.update(ref, { text });

            if (++count >= MAX) {
                await batch.commit();
                batch = writeBatch(this.firestore);
                count = 0;
            }
        }

        if (count) await batch.commit();
    }

    async toggleThreadReaction(
        uid: string,
        dmId: string,
        messageId: string,
        threadMessageId: string,
        emojiId: string,
        you: ReactionUserDoc,
        peerUid?: string
    ) {
        return this.toggleThreadReactionBetween(uid, peerUid, dmId, messageId, threadMessageId, emojiId, you);
    }

    async toggleThreadReactionBetween(
        aUid: string,
        bUid: string | undefined,
        dmId: string,
        messageId: string,
        threadMessageId: string,
        emojiId: string,
        you: ReactionUserDoc
    ) {
        const uids = this.participants(aUid, bUid);

        let nextReactions: ReactionDoc[] = [];

        await runTransaction(this.firestore, async tx => {
            const ownerRef = this.dmThreadMsgDoc(aUid, dmId, messageId, threadMessageId);
            const snap = await tx.get(ownerRef);
            if (!snap.exists()) return;

            const data = snap.data() as MessageDoc;
            data.reactions ||= [];

            const idx = data.reactions.findIndex(r => r.emojiId === emojiId);

            if (idx >= 0) {
                const rx = data.reactions[idx];
                rx.reactionUsers ||= [];

                const youIdx = rx.reactionUsers.findIndex(u => u.userId === you.userId);
                if (youIdx >= 0) {
                    rx.reactionUsers.splice(youIdx, 1);
                    rx.emojiCount = Math.max(0, (rx.emojiCount ?? 0) - 1);

                    if (rx.emojiCount === 0 || rx.reactionUsers.length === 0) {
                        data.reactions.splice(idx, 1);
                    }
                } else {
                    rx.reactionUsers.push(you);
                    rx.emojiCount = (rx.emojiCount ?? 0) + 1;
                }
            } else {
                data.reactions.push({ emojiId, emojiCount: 1, reactionUsers: [you] } as any);
            }

            nextReactions = data.reactions as ReactionDoc[];
            tx.update(ownerRef, { reactions: nextReactions } as any);
        });

        const MAX = 500;
        let batch = writeBatch(this.firestore);
        let count = 0;

        for (const uid of uids) {
            const ref = this.dmThreadMsgDoc(uid, dmId, messageId, threadMessageId);
            batch.set(ref, { reactions: nextReactions } as any, { merge: true });

            if (++count >= MAX) {
                await batch.commit();
                batch = writeBatch(this.firestore);
                count = 0;
            }
        }

        if (count) await batch.commit();
    }

    async refreshRootCounters(
        uid: string, 
        dmId: string, 
        messageId: string, 
        peerUid?: string
    ) {
        const uids = this.participants(uid, peerUid);

        const qy = query(this.dmThreadMsgsCol(uid, dmId, messageId), orderBy('createdAt', 'desc'), limit(1));
        const lastSnap = await getDocs(qy);
        const lastDoc = lastSnap.docs[0]?.data() as MessageDoc | undefined;

        const allSnap = await getDocs(this.dmThreadMsgsCol(uid, dmId, messageId));
        const repliesCount = allSnap.size;

        const lastReplyTime = lastDoc?.createdAt ? lastDoc.createdAt : null;

        const MAX = 450;
        let batch = writeBatch(this.firestore);
        let count = 0;

        for (const u of uids) {
            const rootRef = this.dmMsgDoc(u, dmId, messageId);
            batch.set(
                rootRef,
                {
                    repliesCount,
                    lastReplyTime: lastReplyTime ? lastReplyTime : null
                } as any,
                { merge: true }
            );

            if (++count >= MAX) {
                await batch.commit();
                batch = writeBatch(this.firestore);
                count = 0;
            }
        }

        if (count) await batch.commit();
    }
}