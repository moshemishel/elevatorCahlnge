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
        while (true) {
            const targetFloor = elevator.queue.peek();
            if (targetFloor === null) {
                console.log(`[Elevator ${elevator.id}] Queue empty, stopping operation`);
                elevator.isOperating = false;
                return;
            }
            
            console.log(`[Elevator ${elevator.id}] Processing floor ${targetFloor} from queue`);
            await ElevatorMovementManger.goToFloor(elevator, targetFloor);
            elevator.queue.dequeue();
            
            // Update estimate time after completing each floor
            if (elevator instanceof (await import('./Elevator')).Elevator) {
                (elevator as any).onEstimateTimeUpdateCallback?.(elevator.id);
            }
        }
    }

    private static arriveAtFloor(elevator: AbstractElevator, floor: number): Promise<void> {
        console.log(`[Elevator ${elevator.id}] Arriving at floor ${floor}`);
        
        // Set the final floor position (this will trigger onArrivalCallback)
        elevator.currentFloor = floor;

        // Wait the required stop duration to simulate door open/close time
        return new Promise<void>((resolve) => {
            setTimeout(() => {
                console.log(`[Elevator ${elevator.id}] Doors closed at floor ${floor}, ready to continue`);
                resolve();
            }, ElevatorMovementManger.SECONDS_TO_STOP_AT_FLOOR * 1000);
        });
    }

    private static async goToFloor(
        elevator: AbstractElevator,
        targetFloor: number
    ): Promise<void> {
        if (Math.floor(elevator.currentFloor) === targetFloor) {
            console.log(`[Elevator ${elevator.id}] Already at target floor ${targetFloor}`);
            return Promise.resolve();
        }

        console.log(`[Elevator ${elevator.id}] Moving to floor ${targetFloor} from ${elevator.currentFloor}`);

        return new Promise<void>((resolve) => {
            const startFloor = elevator.currentFloor;
            const duration = ElevatorMovementManger.getTimeToMoveBetweenFloors(
                startFloor,
                targetFloor
            ) * 1000; // Convert to milliseconds

            const startTime = performance.now();

            const animate = async (currentTime: number) => {
                const elapsed = currentTime - startTime;
                
                if (elapsed >= duration) {
                    // Movement complete - arrive at floor
                    await ElevatorMovementManger.arriveAtFloor(elevator, targetFloor);
                    resolve();
                    return;
                }

                // Update position during movement
                const progress = elapsed / duration;
                const currentPosition = startFloor + (targetFloor - startFloor) * progress;
                
                // Use updatePosition to trigger move callbacks without arrival logic
                elevator.updatePosition(currentPosition);

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