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

export type FirestoreUnsubscribtion = Unsubscribe;

export function toDate(x: any): Date {
    if (x instanceof Date) return x;
    if (x && typeof x.toDate === 'function') return (x as Timestamp).toDate();
    return new Date(x);
}