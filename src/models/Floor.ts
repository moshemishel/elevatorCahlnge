import { BaseEntity } from ".";
import { ElevatorDispatcher } from './types';

export class Floor extends BaseEntity {
    protected static elevatorDispatcherFromBuilding: ElevatorDispatcher;

    #isCallingToElevator: boolean = false;
    #estimatedWaitTimeSeconds: number = -1;
    #arrivalTimerInterval: number | null = null;
    
    // Event callbacks - will be set by Building
    public onElevatorArrivedCallback?: (floorNumber: number) => void;

    constructor(id: number) {
        super(id);
    }

    get floorNumber() {
        return this.id;
    }

    get isCallingToElevator() {
        return this.#isCallingToElevator;
    }

    set isCallingToElevator(status: boolean) {
        this.#isCallingToElevator = status;
    }

    get estimatedWaitTimeSeconds() {
        return this.#estimatedWaitTimeSeconds;
    }

    set estimatedWaitTimeSeconds(seconds: number) {
        this.#estimatedWaitTimeSeconds = seconds;
    }

    get arrivalTimerInterval() {
        return this.#arrivalTimerInterval;
    }

    set arrivalTimerInterval(interval: number | null) {
        this.#arrivalTimerInterval = interval;
    }

    callElevator(): boolean {
        if (this.isCallingToElevator) {
            console.log(`[Floor ${this.floorNumber}] Elevator call ignored - already calling elevator`);
            return false;
        }

        console.log(`[Floor ${this.floorNumber}] Calling elevator...`);
        const waitTimeSeconds = (this.constructor as typeof Floor).elevatorDispatcherFromBuilding(this.floorNumber);
        this.isCallingToElevator = true;
        this.estimatedWaitTimeSeconds = waitTimeSeconds;
        console.log(`[Floor ${this.floorNumber}] Elevator dispatched, estimated wait time: ${waitTimeSeconds}s`);
        this.startTrackingArrivalTime();
        return true;
    }

    private elevatorArrived(): void {
        console.log(`[Floor ${this.floorNumber}] Elevator has arrived!`);
        this.stopTrackingArrivalTime();
        this.isCallingToElevator = false;
        this.estimatedWaitTimeSeconds = -1;
        
        // Trigger elevator arrival event
        console.log(`[Floor ${this.floorNumber}] Notifying elevator arrival event`);
        this.onElevatorArrivedCallback?.(this.floorNumber);
    }

    // Public method to trigger elevator arrival (called by Building when elevator arrives)
    public triggerElevatorArrival(): void {
        console.log(`[Floor ${this.floorNumber}] Elevator arrival triggered externally`);
        this.elevatorArrived();
    }

    // Tracks remaining wait time, updating every 100ms
    private startTrackingArrivalTime(): void {
        console.log(`[Floor ${this.floorNumber}] Starting to track arrival time`);
        // Start interval to update time remaining
        this.arrivalTimerInterval = setInterval(() => {
            if (this.estimatedWaitTimeSeconds > 0) {
                this.estimatedWaitTimeSeconds -= 0.1;
            } else {
                console.log(`[Floor ${this.floorNumber}] Wait time expired, elevator should have arrived`);
                this.elevatorArrived(); // This will now trigger the event
            }
        }, 100);
    }

    private stopTrackingArrivalTime(): void {
        if (this.arrivalTimerInterval !== null) {
            console.log(`[Floor ${this.floorNumber}] Stopping arrival time tracking`);
            clearInterval(this.arrivalTimerInterval);
            this.arrivalTimerInterval = null;
        }
    }

    // Method to set event callback (called by Building)
    public setEventCallback(onElevatorArrived: (floorNumber: number) => void) {
        console.log(`[Floor ${this.floorNumber}] Event callback registered`);
        this.onElevatorArrivedCallback = onElevatorArrived;
    }

    private startBoardingTimer(): void {
    // חישוב סף האזהרה בהתבסס על הזמן הנותר
    const warningTime = elevatorConstants.WARNING_TIME_SECONDS;
    
    this.#boardingTimerInterval = setInterval(() => {
        this.#boardingTimeRemaining -= 0.1;
        
        if (this.#boardingTimeRemaining <= 0) {
            // הזמן נגמר
            console.log(`[Floor ${this.floorNumber}] Boarding time ended for elevator ${this.#elevatorAtFloorId}`);
            this.endBoarding();
        } else if (this.#boardingTimeRemaining <= warningTime && this.#elevatorBoardingState === 'boarding') {
            // מעבר למצב אזהרה
            console.log(`[Floor ${this.floorNumber}] Entering warning state, ${this.#boardingTimeRemaining.toFixed(1)}s remaining`);
            this.#elevatorBoardingState = 'warning';
        }
    }, 100);
}
}