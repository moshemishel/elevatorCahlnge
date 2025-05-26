import { ElevatorQueueInterface } from ".";

export class ElevatorQueue implements ElevatorQueueInterface {
    #requests: number[] = [];

    private addToEnd(floor: number): void {
        if (!this.#requests.includes(floor)) {
            this.#requests.push(floor);
        }
    }

    private removeFirst(): number | null {
        return this.#requests.shift() ?? null;
    }

    private getFirst(): number | null {
        return this.#requests[0] ?? null;
    }

    // === public API ===

    public enqueue(floor: number): void {
        this.addToEnd(floor);
    }

    public dequeue(): number | null {
        return this.removeFirst();
    }

    public peek(): number | null {
        return this.getFirst();
    }

    public getAllRequests(): number[] {
        return [...this.#requests];
    }
}
