import { Injectable, inject } from '@angular/core';
import {
    Firestore, collection, doc, query, orderBy, onSnapshot,
    serverTimestamp, writeBatch, runTransaction, getDoc, updateDoc
} from '@angular/fire/firestore';
import { MessageDoc, ReactionDoc, ReactionUserDoc, FirestoreUnsubscribtion, toDate } from './messages.types';
import { MembershipStore } from './membership.store';

@Injectable({ providedIn: 'root' })
export class ChannelMessagesStore {
    private firestore = inject(Firestore);
    private membership = inject(MembershipStore);

    // Collection: users/{uid}/messages/channels/{channelId}
    private channelMsgsCol(uid: string, channelId: string) {
        return collection(this.firestore, `users/${uid}/messages/channels/${channelId}`);
    }

    // Doc: users/{uid}/messages/channels/{channelId}/{messageId}
    private channelMsgDoc(uid: string, channelId: string, messageId: string) {
        return doc(this.firestore, `users/${uid}/messages/channels/${channelId}/${messageId}`);
    }

    listenChannelMessages(
        uid: string,
        channelId: string,
        cb: (msgs: (MessageDoc & { id: string })[]) => void
    ): FirestoreUnsubscribtion {
        const qy = query(this.channelMsgsCol(uid, channelId), orderBy('createdAt', 'asc'));
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

    async sendChannelMessage(
        uid: string,
        channelId: string,
        params: { text: string; author: { uid: string; username: string; avatar: string } }
    ) {
        const memberUids = await this.membership.getMemberUids(uid, channelId);
        const id = doc(this.channelMsgsCol(uid, channelId)).id;

        const payload: MessageDoc = {
            text: params.text,
            createdAt: serverTimestamp(),
            author: params.author,
            reactions: [],
            repliesCount: 0,
            lastReplyTime: null
        };

        await this.batchSetToMembers(memberUids, (memberUid) => this.channelMsgDoc(memberUid, channelId, id), payload);
        return id;
    }

    async updateChannelMessage(
        uid: string,
        channelId: string, messageId: string,
        text: string
    ) {
        const memberUids = await this.membership.getMemberUids(uid, channelId);
        await this.batchUpdateToMembers(memberUids, (memberUid) => this.channelMsgDoc(memberUid, channelId, messageId), { text });
    }

    async toggleChannelReaction(
        uid: string,
        channelId: string,
        messageId: string,
        emojiId: string,
        you: ReactionUserDoc
    ) {
        const memberUids = await this.membership.getMemberUids(uid, channelId);
        let nextReactions: ReactionDoc[] = [];

        await runTransaction(this.firestore, async tx => {
            const ownerRef = this.channelMsgDoc(uid, channelId, messageId);
            const snap = await tx.get(ownerRef);
            if (!snap.exists()) return;

            const data = snap.data() as MessageDoc;
            data.reactions ||= [];

            nextReactions = mutateReactions([...data.reactions], emojiId, you);
            tx.update(ownerRef, { reactions: nextReactions });
        });

        await this.batchSetToMembers(memberUids, (memberUid) => this.channelMsgDoc(memberUid, channelId, messageId), { reactions: nextReactions }, true);
    }

    // -------- helpers --------

    private async batchSetToMembers(
        memberUids: string[],
        refFn: (uid: string) => any,
        payload: any,
        merge = false
    ) {
        const MAX = 500;
        let batch = writeBatch(this.firestore);
        let count = 0;

        for (const u of memberUids) {
            batch.set(refFn(u), payload, { merge });
            if (++count >= MAX) { await batch.commit(); batch = writeBatch(this.firestore); count = 0; }
        }
        if (count) await batch.commit();
    }

    private async batchUpdateToMembers(
        memberUids: string[],
        refFn: (uid: string) => any,
        payload: any
    ) {
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

function mutateReactions(
    reactions: ReactionDoc[],
    emojiId: string, 
    you: ReactionUserDoc
): ReactionDoc[] {
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