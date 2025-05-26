import { ElevatorQueue } from "./";
import { ElevatorMovementManger } from './ElevatorMovement';
import { ElevatorQueueInterface, ElevatorMovementStrategy} from './types';
import { elevatorConstants } from '../constants';
import { BaseEntity } from './BaseEntity';

export abstract class AbstractElevator extends BaseEntity {
    public abstract get currentFloor(): number;
    public abstract set currentFloor(floor: number);
    public abstract get queue(): ElevatorQueueInterface;
    public abstract get isOperating(): boolean;
    public abstract set isOperating(val: boolean);
    
    // Added method to update position without triggering arrival logic
    public abstract updatePosition(position: number): void;
}

export class Elevator extends AbstractElevator {
    static readonly #INITIAL_FLOOR = elevatorConstants.INITIAL_FLOOR;
    static elevatorMovement: ElevatorMovementStrategy = ElevatorMovementManger;

    readonly #queue: ElevatorQueue = new ElevatorQueue();
    #currentFloor: number = Elevator.#INITIAL_FLOOR;
    #isOperating: boolean = false;
    
    // Event callbacks - will be set by Building
    public onMoveCallback?: (elevatorId: number, position: number) => void;
    public onArrivalCallback?: (elevatorId: number, floorNumber: number) => void;
    public onEstimateTimeUpdateCallback?: (elevatorId: number) => void;

    constructor(id: number) {
        super(id);
    }

    public get currentFloor() {
        return this.#currentFloor;
    }

    public get queue(): ElevatorQueueInterface {
        return this.#queue;
    }

    public get isOperating() {
        return this.#isOperating;
    }

    public set isOperating(val: boolean) {
        if (this.#isOperating !== val) {
            console.log(`[Elevator ${this.id}] Operating status changed: ${this.#isOperating} -> ${val}`);
        }
        this.#isOperating = val;
    }

    public set currentFloor(newFloor: number) {
        const oldFloor = this.#currentFloor;
        this.#currentFloor = newFloor;
        
        console.log(`[Elevator ${this.id}] Arrived at floor ${newFloor} from floor ${oldFloor}`);
        
        // Trigger arrival event when actually arriving at a floor
        this.onArrivalCallback?.(this.id, newFloor);
    }

    // Method to update position during movement without triggering arrival
    public updatePosition(position: number) {
        this.#currentFloor = position;
        
        // Trigger move event for every position update
        this.onMoveCallback?.(this.id, position);
    }

    public get elevatorMovement() {
        return Elevator.elevatorMovement;
    }
    
    public addRequest(floor: number) {
        console.log(`[Elevator ${this.id}] New request added for floor ${floor}`);
        this.#queue.enqueue(floor);
        
        // Trigger estimate time update when new request is added
        console.log(`[Elevator ${this.id}] Triggering estimate time update`);
        this.onEstimateTimeUpdateCallback?.(this.id);
        
        if (!this.isOperating) {
            console.log(`[Elevator ${this.id}] Starting operation to process queue`);
            this.isOperating = true;
            (this.constructor as typeof Elevator).elevatorMovement.processFloorQueue(this);
        }
    }

    public getTimeToReachFloor(floorNumber: number) {
        return this.elevatorMovement.getTimeToReachFloor(this, floorNumber);
    }

    // Method to trigger estimate time update manually if needed
    public triggerEstimateTimeUpdate() {
        console.log(`[Elevator ${this.id}] Manual estimate time update triggered`);
        this.onEstimateTimeUpdateCallback?.(this.id);
    }

    // Method to set event callbacks (called by Building)
    public setEventCallbacks(
        onMove: (elevatorId: number, position: number) => void,
        onArrival: (elevatorId: number, floorNumber: number) => void,
        onEstimateTimeUpdate: (elevatorId: number) => void
    ) {
        console.log(`[Elevator ${this.id}] Event callbacks registered`);
        this.onMoveCallback = onMove;
        this.onArrivalCallback = onArrival;
        this.onEstimateTimeUpdateCallback = onEstimateTimeUpdate;
    }
}