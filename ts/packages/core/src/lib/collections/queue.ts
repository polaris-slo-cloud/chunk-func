import { LinkedList, LinkedListItem } from "./linked-list";

/**
 * Represents a simple queue data structure.
 */
export interface Queue<T> {

    /** The number of items in the queue. */
    readonly length: number;

    /**
     * Enqueues an item.
     */
    enqueue(item: T): void;

    /**
     * Dequeues the first item in the queue.
     *
     * @returns the dequeued item or `undefined` if the queue is empty.
     */
    dequeue(): T | undefined;

}

/**
 * Implements a queue using a linked list.
 */
export class LinkedListQueue<T> implements Queue<T> {

    private queue = new LinkedList<T>();

    get length(): number {
        return this.queue.length;
    }

    enqueue(item: T): void {
        this.queue.push(item);
    }

    dequeue(): T | undefined {
        return this.queue.pop();
    }

}
