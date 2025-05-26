import { AbstractElevator } from "./Elevator";

export interface ElevatorQueueInterface {
  enqueue(floor: number): void;
  dequeue(): number | null;
  peek(): number | null;
  getAllRequests(): number[];
}

export interface ElevatorMovementStrategy {
    processFloorQueue: (elevator: any)=> void; //need to replace any with AbstractElevator
    getTimeToReachFloor: (elevator: any, targetFloor: number) => number
}

export interface ElevatorDispatcher {
    (floorNumber: number): number;
}

// Generic factory interface for creating items of type T
export interface Factory<T, Args extends any[]> {
  create(...args: Args): T;
}