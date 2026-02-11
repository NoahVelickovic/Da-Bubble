import { Injectable, inject, NgZone } from '@angular/core';
import {
    Firestore, collection, doc, query, orderBy, onSnapshot,
    serverTimestamp, writeBatch, runTransaction, increment
} from '@angular/fire/firestore';
import { MessageDoc, ReactionDoc, ReactionUserDoc, FirestoreUnsubscribtion, toDate } from './messages.types';
import { MembershipStore } from './membership.store';

@Injectable({ providedIn: 'root' })
export class ChannelThreadsStore {
    private firestore = inject(Firestore);
    private zone = inject(NgZone);
    private membership = inject(MembershipStore);

    // Doc: users/{uid}/messages/channels/{channelId}/{messageId}
    private channelMsgDoc(uid: string, channelId: string, messageId: string) {
        return doc(this.firestore, `users/${uid}/messages/channels/${channelId}/${messageId}`);
    }

    // Collection: users/{uid}/messages/channels/{channelId}/{messageId}/threads
    private threadMsgsCol(uid: string, channelId: string, messageId: string) {
        return collection(this.firestore, `users/${uid}/messages/channels/${channelId}/${messageId}/threads`);
    }

    // Doc: users/{uid}/messages/channels/{channelId}/{messageId}/threads/{threadMessageId}
    private threadMsgDoc(uid: string, channelId: string, messageId: string, threadMessageId: string) {
        return doc(this.firestore, `users/${uid}/messages/channels/${channelId}/${messageId}/threads/${threadMessageId}`);
    }

    listenThreadMessages(
        uid: string,
        channelId: string,
        messageId: string,
        cb: (msgs: (MessageDoc & { id: string })[]) => void
    ): FirestoreUnsubscribtion {
        const qy = query(this.threadMsgsCol(uid, channelId, messageId), orderBy('createdAt', 'asc'));
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
        channelId: string,
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
        const memberUids = await this.membership.getMemberUids(uid, channelId);
        if (!memberUids.length) return;

        const threadMessageId = doc(this.threadMsgsCol(uid, channelId, messageId)).id;

        const payload: MessageDoc = {
            text: params.text,
            createdAt: serverTimestamp(),
            author: params.author,
            reactions: [],
            repliesCount: 0,
            lastReplyTime: null
        };

        await this.batchSet(memberUids, (u) => this.threadMsgDoc(u, channelId, messageId, threadMessageId), payload, false);

        await this.batchSet(memberUids, (u) => this.channelMsgDoc(u, channelId, messageId), {
            repliesCount: increment(1),
            lastReplyTime: serverTimestamp()
        }, true);
    }

    async updateThreadMessage(
        uid: string,
        channelId: string,
        messageId: string,
        threadMessageId: string,
        text: string
    ) {
        const memberUids = await this.membership.getMemberUids(uid, channelId);
        await this.batchUpdate(memberUids, (u) => this.threadMsgDoc(u, channelId, messageId, threadMessageId), { text });
    }

    async toggleThreadReaction(
        uid: string,
        channelId: string,messageId: string,
        threadMessageId: string,
        emojiId: string,
        you: ReactionUserDoc
    ) {
        const memberUids = await this.membership.getMemberUids(uid, channelId);
        let nextReactions: ReactionDoc[] = [];

        await runTransaction(this.firestore, async tx => {
            const threadRef = this.threadMsgDoc(uid, channelId, messageId, threadMessageId);
            const snap = await tx.get(threadRef);
            if (!snap.exists()) return;

            const data = snap.data() as MessageDoc;
            data.reactions ||= [];

            nextReactions = mutateReactions([...data.reactions], emojiId, you);
            tx.update(threadRef, { reactions: nextReactions });
        });

        await this.batchSet(memberUids, (u) => this.threadMsgDoc(u, channelId, messageId, threadMessageId), { reactions: nextReactions }, true);
    }

    // -------- helpers --------

    private async batchSet(memberUids: string[], refFn: (uid: string) => any, payload: any, merge: boolean) {
        const MAX = 500;
        let batch = writeBatch(this.firestore);
        let count = 0;

        for (const u of memberUids) {
            batch.set(refFn(u), payload, { merge });
            if (++count >= MAX) { await batch.commit(); batch = writeBatch(this.firestore); count = 0; }
        }
        if (count) await batch.commit();
    }

    private async batchUpdate(memberUids: string[], refFn: (uid: string) => any, payload: any) {
        const MAX = 500;
        let batch = writeBatch(this.firestore);
        let count = 0;

        for (const u of memberUids) {
            batch.update(refFn(u), payload);
            if (++count >= MAX) { await batch.commit(); batch = writeBatch(this.firestore); count = 0; }
        }
        if (count) await batch.commit();
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