import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ThreadContext = {
    uid: string;
    channelId: string;
    channelName: string;
    messageId: string;
    root?: {
        author: { uid: string; username: string; avatar: string };
        createdAt: Date | string;
        text: string;
        reactions?: any[];
        isYou?: boolean;
    };
};

@Injectable({ providedIn: 'root' })
export class ThreadStateService {
    private _ctx$ = new BehaviorSubject<ThreadContext | null>(null);

    readonly ctx$ = this._ctx$.asObservable();

    open(ctx: ThreadContext) { this._ctx$.next(ctx); }
    close() { this._ctx$.next(null); }
    get value() { return this._ctx$.value; }
}
