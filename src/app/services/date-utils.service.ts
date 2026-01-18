import { Injectable, Pipe, PipeTransform } from "@angular/core";

type ToDateLike = Date | string | { toDate?: () => Date } | null | undefined;

export type DaySeparated<T> = T & { timeSeparator?: string };

@Injectable({ providedIn: 'root' })
export class DateUtilsService {
    toDate(x: ToDateLike): Date | null {
        if (!x) return null;

        const date = x as any;
        if (typeof date?.toDate === 'function') return this.#valid(date.toDate());
        if (x instanceof Date) return this.#valid(x);
        if (typeof x === 'string') return this.#parseString(x);

        return null;
    }

    #valid(date: Date) {
        return isNaN(date.getTime()) ? null : date;
    }

    #parseString(x: string): Date | null {
        const date = new Date(x);
        if (!isNaN(date.getTime())) return date;

        const m = /^(\d{1,2}):(\d{2})$/.exec(x.trim());
        if (!m) return null;
        const d = new Date();
        d.setHours(+m[1], +m[2], 0, 0);
        return d;
    }

    timeOf(x: ToDateLike): string {
        const date = this.toDate(x);
        if (!date) return '';
        return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr';
    }

    formatDayLabel(date: Date): string {
        const now = this.#startOfDay(new Date());
        const day = this.#startOfDay(date);
        const diffDays = Math.round((now.getTime() - day.getTime()) / 86_400_000);

        if (diffDays === 0) return 'heute';
        if (diffDays === 1) return 'gestern';

        const timeSeparator = new Intl.DateTimeFormat('de-DE', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        }).format(date);

        return timeSeparator.charAt(0).toUpperCase() + timeSeparator.slice(1);
    }

    #startOfDay(date: Date): Date {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }

    withDaySeparators<T extends { createdAt: any }>(
        items: T[],
        opts?: {
            sorted?: boolean;
            makeSeparator?: (date: Date, label: string) => Partial<T> & { timeSeparator: string; createdAt: Date };
            getCreatedAt?: (item: T) => any;
        }
    ): Array<DaySeparated<T>> {
        const o = this.#normalizeOptions(opts);
        const arr = this.#maybeSort(items, o.getCreatedAt, !!o.sorted);
        return this.#injectSeparators(arr, o.getCreatedAt, o.makeSeparator);
    }

    #normalizeOptions<T>(opts: any) {
        const getCreatedAt = (opts?.getCreatedAt ?? ((m: T) => (m as any).createdAt)) as (item: T) => any;
        const makeSeparator =
            (opts?.makeSeparator ??
                ((date: Date, label: string) => ({ createdAt: date, timeSeparator: label } as any))) as
            (date: Date, label: string) => any;
        return { sorted: !!opts?.sorted, getCreatedAt, makeSeparator };
    }

    #maybeSort<T>(items: T[], getCreatedAt: (i: T) => any, sorted: boolean): T[] {
        if (sorted) return [...items];
        return [...items].sort((a, b) => {
            const ta = this.toDate(getCreatedAt(a))?.getTime() ?? Number.POSITIVE_INFINITY;
            const tb = this.toDate(getCreatedAt(b))?.getTime() ?? Number.POSITIVE_INFINITY;
            return ta - tb;
        });
    }

    #injectSeparators<T>(
        arr: T[],
        getCreatedAt: (i: T) => any,
        makeSeparator: (date: Date, label: string) => any
    ): Array<DaySeparated<T>> {
        const out: Array<DaySeparated<T>> = [];
        let lastKey: string | null = null;

        for (const item of arr) {
            const d = this.toDate(getCreatedAt(item));
            if (!d) { out.push(item as any); continue; }

            const key = this.#dayKey(d);
            if (key !== lastKey) {
                out.push(makeSeparator(d, this.formatDayLabel(d)));
                lastKey = key;
            }

            const clean = { ...(item as any) };
            if ('timeSeparator' in clean) delete clean.timeSeparator;
            out.push(clean);
        }
        return out;
    }

    #dayKey(date: Date | null): string | null {
        if (!date) return null;

        const y = date.getFullYear();
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const d = date.getDate().toString().padStart(2, '0');

        return `${y}-${m}-${d}`;
    }
}

@Pipe({ name: 'timeOf', standalone: true, pure: true })
export class TimeOfPipe implements PipeTransform {
    constructor(private time: DateUtilsService) { }

    transform(value: ToDateLike): string {
        return this.time.timeOf(value);
    }
}