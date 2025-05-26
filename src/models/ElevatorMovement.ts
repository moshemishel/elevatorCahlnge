import { elevatorConstants } from '../constants';
import { AbstractElevator } from './Elevator';

export class ElevatorMovementManger {
  protected static readonly SECONDS_TO_MOVE_ONE_FLOOR =
    elevatorConstants.SECONDS_TO_MOVE_ONE_FLOOR;
  protected static readonly SECONDS_TO_STOP_AT_FLOOR =
    elevatorConstants.SECONDS_TO_STOP_AT_FLOOR;

  private static getTimeToMoveBetweenFloors(
    fromFloor: number,
    toFloor: number
  ) {
    const floorDiff = Math.abs(toFloor - fromFloor);
    return floorDiff * ElevatorMovementManger.SECONDS_TO_MOVE_ONE_FLOOR;
  }

  static async processFloorQueue(elevator: AbstractElevator) {
    const targetFloor = elevator.queue.peek();
    if (targetFloor === null) {
      elevator.isOperating = false;
      return;
    }
    await ElevatorMovementManger.goToFloor(elevator, targetFloor);
    elevator.queue.dequeue();
    await ElevatorMovementManger.processFloorQueue(elevator);
  }

  private static arriveAtFloor(elevator: AbstractElevator, floor: number) {
    elevator.currentFloor = floor;

    // Wait the required stop duration to simulate door open/close time
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, ElevatorMovementManger.SECONDS_TO_STOP_AT_FLOOR * 1000);
    });
  }

  private static async goToFloor(
    elevator: AbstractElevator,
    targetFloor: number
  ): Promise<void> {
    if (elevator.currentFloor === targetFloor) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      const startFloor = elevator.currentFloor;
      const duration = ElevatorMovementManger.getTimeToMoveBetweenFloors(
        startFloor,
        targetFloor
      );

      const startTime = performance.now();

      const animate = async (currentTime: number) => {
        const elapsed = currentTime - startTime;
        if (elapsed >= duration) {
          await ElevatorMovementManger.arriveAtFloor(elevator, targetFloor);
          resolve();
          return;
        }

        const progress = elapsed / duration;
        const currentFloor = startFloor + (targetFloor - startFloor) * progress;
        elevator.currentFloor = currentFloor;

        requestAnimationFrame(animate);
      };

      requestAnimationFrame(animate);
    });
  }

  public static getTimeToReachFloor(
    elevator: AbstractElevator,
    targetFloor: number
  ): number {
    const currentFloor = elevator.currentFloor;
    const queueArray = elevator.queue.getAllRequests();
    let totalTime = 0;

    // If queue is empty, calculate direct time to target
    if (queueArray.length === 0) {
      totalTime = ElevatorMovementManger.getTimeToMoveBetweenFloors(
        currentFloor,
        targetFloor
      );
      return totalTime;
    }

    // Check if target floor is already in the queue
    const targetIndex = queueArray.indexOf(targetFloor);
    let floorsToProcess: number[];

    if (targetIndex !== -1) {
      // Target is in queue - only process floors up to and including target
      floorsToProcess = queueArray.slice(0, targetIndex + 1);
    } else {
      // Target not in queue - process all queue floors, then add target
      floorsToProcess = [...queueArray, targetFloor];
    }

    // Calculate time from current floor to first target
    let previousFloor = currentFloor;

    for (let i = 0; i < floorsToProcess.length; i++) {
      const floor = floorsToProcess[i];

      // Add travel time to this floor
      totalTime += ElevatorMovementManger.getTimeToMoveBetweenFloors(
        previousFloor,
        floor
      );

      // Add stop time at this floor
      totalTime += ElevatorMovementManger.SECONDS_TO_STOP_AT_FLOOR;

      // If this is our target floor, we're done
      if (floor === targetFloor) {
        break;
      }

      previousFloor = floor;
    }

    return totalTime;
  }
}
