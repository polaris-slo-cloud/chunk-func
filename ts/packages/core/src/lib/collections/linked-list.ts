
/**
 * Represents and item in a singly linked list.
 */
export interface LinkedListItem<T> {

    /** The stored data. */
    data: T;

    /** The next item in the list or `undefined`, if this is the tail item. */
    next?: LinkedListItem<T>;

}

export class LinkedList<T> {

    private listLength = 0;
    private listHead?: LinkedListItem<T>;
    private listTail?: LinkedListItem<T>;

    get length(): number {
        return this.listLength;
    }

    head(): LinkedListItem<T> | undefined {
        return this.listHead;
    }

    tail(): LinkedListItem<T> | undefined {
        return this.listTail;
    }

    /**
     * Adds a new item to the end of the list.
     */
    push(data: T): void {
        const newItem: LinkedListItem<T> = { data };
        if (this.listTail) {
            this.listTail.next = newItem;
        } else {
            this.listHead = newItem;
        }
        this.listTail = newItem;
        ++this.listLength;
    }

    /**
     * Removes the first item from the list.
     */
    pop(): T | undefined {
        if (!this.listHead) {
            return undefined;
        }
        const oldHead = this.listHead;

        if (this.listHead.next) {
            this.listHead = this.listHead.next;
        } else {
            this.listHead = undefined;
            this.listTail = undefined;
        }
        --this.listLength;

        return oldHead.data;
    }

}
