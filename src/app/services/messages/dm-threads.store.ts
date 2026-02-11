import { Injectable, inject, NgZone } from '@angular/core';
import {
    Firestore, collection, doc, query, orderBy, onSnapshot,
    serverTimestamp, writeBatch, runTransaction, increment, getDoc, updateDoc
} from '@angular/fire/firestore';
import { MessageDoc, ReactionDoc, ReactionUserDoc, FirestoreUnsubscribtion, toDate } from './messages.types';
import { DmMessagesStore } from './dm-messages.store';

@Injectable({ providedIn: 'root' })
export class DmThreadsStore {
    private firestore = inject(Firestore);
    private zone = inject(NgZone);
    private dmStore = inject(DmMessagesStore);

    // Doc: users/{uid}/messages/directMessages/{dmId}/{messageId}
    private dmMsgDoc(uid: string, dmId: string, messageId: string) {
        return doc(this.firestore, `users/${uid}/messages/directMessages/${dmId}/${messageId}`);
    }

    // Collection: users/${uid}/messages/directMessages/${dmId}/${messageId}/threads
    private dmThreadCol(uid: string, dmId: string, messageId: string) {
        return collection(this.firestore, `users/${uid}/messages/directMessages/${dmId}/${messageId}/threads`);
    }

    // Doc: users/${uid}/messages/directMessages/${dmId}/${messageId}/threads/${threadMessageId}
    private dmThreadDoc(uid: string, dmId: string, messageId: string, threadMessageId: string) {
        return doc(this.firestore, `users/${uid}/messages/directMessages/${dmId}/${messageId}/threads/${threadMessageId}`);
    }

    listenThreadMessages(
        uid: string, 
        dmId: string, 
        messageId: string, 
        cb: (msgs: (MessageDoc & { id: string })[]) => void
    ): FirestoreUnsubscribtion {
        const qy = query(this.dmThreadCol(uid, dmId, messageId), orderBy('createdAt', 'asc'));
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

    async sendReplySelf(
        uid: string, 
        rootMessageId: string, 
        params: { 
            text: string; 
            author: { 
                uid: string; 
                username: string; 
                avatar: string 
            }
        }
    ) {
        return this.sendReplyBetween(uid, uid, 'self', rootMessageId, params, true);
    }

    async sendReplyBetween(
        aUid: string, 
        bUid: string, 
        dmId: string, 
        rootMessageId: string, 
        params: { 
            text: string; 
            author: any 
        }, 
        isSelf = false
    ) {
        const threadMessageId = doc(this.dmThreadCol(aUid, dmId, rootMessageId)).id;

        const payload: MessageDoc = {
            text: params.text,
            createdAt: serverTimestamp(),
            author: params.author,
            reactions: [],
            repliesCount: 0,
            lastReplyTime: null
        };

        const batch1 = writeBatch(this.firestore);
        batch1.set(this.dmThreadDoc(aUid, dmId, rootMessageId, threadMessageId), payload, { merge: false });
        if (!isSelf) batch1.set(this.dmThreadDoc(bUid, dmId, rootMessageId, threadMessageId), payload, { merge: false });
        await batch1.commit();

        const batch2 = writeBatch(this.firestore);
        batch2.set(this.dmMsgDoc(aUid, dmId, rootMessageId), {
            repliesCount: increment(1),
            lastReplyTime: serverTimestamp()
        } as any, { merge: true });

        if (!isSelf) {
            batch2.set(this.dmMsgDoc(bUid, dmId, rootMessageId), {
                repliesCount: increment(1),
                lastReplyTime: serverTimestamp()
            } as any, { merge: true });
        }

        await batch2.commit();

        return threadMessageId;
    }

    async updateThreadMessage(
        uid: string, 
        dmId: string, 
        rootMessageId: string, 
        threadMessageId: string, 
        text: string
    ) {
        await updateDoc(this.dmThreadDoc(uid, dmId, rootMessageId, threadMessageId), { text });
    }

    async toggleThreadReaction(
        uid: string, 
        dmId: string, 
        rootMessageId: string, 
        threadMessageId: string, 
        emojiId: string, 
        you: ReactionUserDoc
    ) {
        const ref = this.dmThreadDoc(uid, dmId, rootMessageId, threadMessageId);
        let nextReactions: ReactionDoc[] = [];

        await runTransaction(this.firestore, async tx => {
            const snap = await tx.get(ref);
            if (!snap.exists()) return;

            const data = snap.data() as MessageDoc;
            data.reactions ||= [];

            nextReactions = mutateReactions([...data.reactions], emojiId, you);
            tx.update(ref, { reactions: nextReactions });
        });
    }

    async toggleThreadReactionBetween(
        aUid: string,
        bUid: string,
        dmId: string,
        rootMessageId: string,
        threadMessageId: string,
        emojiId: string,
        you: ReactionUserDoc
    ) {
        await this.toggleThreadReaction(aUid, dmId, rootMessageId, threadMessageId, emojiId, you);

        const aRef = this.dmThreadDoc(aUid, dmId, rootMessageId, threadMessageId);
        const aSnap = await getDoc(aRef);
        if (!aSnap.exists()) return;

        const data = aSnap.data() as MessageDoc;
        await updateDoc(this.dmThreadDoc(bUid, dmId, rootMessageId, threadMessageId), { reactions: data.reactions });
    }
}

function mutateReactions(reactions: ReactionDoc[], emojiId: string, you: ReactionUserDoc): ReactionDoc[] {
    const idx = reactions.findIndex(r => r.emojiId === emojiId);

    if (idx >= 0) {
        const rx = { ...reactions[idx], reactionUsers: [...reactions[idx].reactionUsers] };
        const youIdx = rx.reactionUsers.findIndex(u => u.userId === you.userId);

        if (youIdx >= 0) {
            rx.reactionUsers.splice(youIdx, 1);
            rx.emojiCount = Math.max(0, rx.emojiCount - 1);

            if (rx.emojiCount === 0 || rx.reactionUsers.length === 0) {
                reactions.splice(idx, 1);
            } else {
                reactions[idx] = rx;
            }
        } else {
            rx.reactionUsers.push(you);
            rx.emojiCount += 1;
            reactions[idx] = rx;
        }

        return reactions;
    }

    return [...reactions, { emojiId, emojiCount: 1, reactionUsers: [you] }];
}