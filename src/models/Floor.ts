
import { BaseEntity } from ".";
import { ElevatorDispatcher } from './types';
import { elevatorConstants } from '../constants';

export class Floor extends BaseEntity {
    protected static elevatorDispatcherFromBuilding: ElevatorDispatcher;

    #isCallingToElevator: boolean = false;
    #estimatedWaitTimeSeconds: number = -1;
    #arrivalTimerInterval: NodeJS.Timeout | null = null;  // Changed from number
    
    // New boarding state properties
    #elevatorBoardingState: 'none' | 'boarding' | 'warning' = 'none';
    #boardingTimeRemaining: number = 0;
    #boardingTimerInterval: NodeJS.Timeout | null = null;  // Changed from number
    #elevatorAtFloorId: number | null = null;
    
    // Event callbacks
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

    set arrivalTimerInterval(interval: NodeJS.Timeout | null) {  // Changed from number
        this.#arrivalTimerInterval = interval;
    }

    // New getters for boarding state
    get elevatorBoardingState() {
        return this.#elevatorBoardingState;
    }

    get boardingTimeRemaining() {
        return this.#boardingTimeRemaining;
    }

    get elevatorAtFloorId() {
        return this.#elevatorAtFloorId;
    }

    callElevator(): boolean {
        // If elevator is at floor in boarding state, can join
        if (this.#elevatorBoardingState === 'boarding') {
            console.log(`[Floor ${this.floorNumber}] Joining existing elevator ${this.#elevatorAtFloorId} during boarding time`);
            return true;
        }

        // If in warning state, it's a new request
        if (this.#elevatorBoardingState === 'warning') {
            console.log(`[Floor ${this.floorNumber}] Warning time - creating new elevator request`);
        }

        if (this.isCallingToElevator && this.#elevatorBoardingState === 'none') {
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
        
        // Don't start boarding if another elevator is already at floor
        if (this.#elevatorBoardingState !== 'none') {
            console.log(`[Floor ${this.floorNumber}] Another elevator already at floor, not starting boarding`);
            this.onElevatorArrivedCallback?.(this.floorNumber);
            return;
        }
        
        // Don't start boarding state here - wait for call from Building
        this.onElevatorArrivedCallback?.(this.floorNumber);
    }

    // New method - called from Building with elevator details
    public startElevatorBoarding(elevatorId: number, boardingTimeSeconds: number): void {
        console.log(`[Floor ${this.floorNumber}] Starting boarding state for elevator ${elevatorId}, duration: ${boardingTimeSeconds}s`);
        
        this.#elevatorAtFloorId = elevatorId;
        this.#boardingTimeRemaining = boardingTimeSeconds;
        this.#elevatorBoardingState = 'boarding';
        
        // Start timer to track boarding time
        this.startBoardingTimer();
    }

    private startBoardingTimer(): void {
        // Calculate warning threshold based on remaining time
        const warningTime = elevatorConstants.WARNING_TIME_SECONDS;
        
        this.#boardingTimerInterval = setInterval(() => {
            this.#boardingTimeRemaining -= 0.1;
            
            if (this.#boardingTimeRemaining <= 0) {
                // Time is up
                console.log(`[Floor ${this.floorNumber}] Boarding time ended for elevator ${this.#elevatorAtFloorId}`);
                this.endBoarding();
            } else if (this.#boardingTimeRemaining <= warningTime && this.#elevatorBoardingState === 'boarding') {
                // Switch to warning state
                console.log(`[Floor ${this.floorNumber}] Entering warning state, ${this.#boardingTimeRemaining.toFixed(1)}s remaining`);
                this.#elevatorBoardingState = 'warning';
            }
        }, 100);
    }

    private endBoarding(): void {
        if (this.#boardingTimerInterval !== null) {
            clearInterval(this.#boardingTimerInterval);
            this.#boardingTimerInterval = null;
        }
        
        this.#elevatorBoardingState = 'none';
        this.#boardingTimeRemaining = 0;
        this.#elevatorAtFloorId = null;
        
        console.log(`[Floor ${this.floorNumber}] Boarding state cleared`);
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
                this.elevatorArrived();
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

    // Public method to trigger elevator arrival (called by Building when elevator arrives)
    public triggerElevatorArrival(): void {
        console.log(`[Floor ${this.floorNumber}] Elevator arrival triggered externally`);
        this.elevatorArrived();
    }

    // Method to set event callback (called by Building)
    public setEventCallback(onElevatorArrived: (floorNumber: number) => void) {
        console.log(`[Floor ${this.floorNumber}] Event callback registered`);
        this.onElevatorArrivedCallback = onElevatorArrived;
    }
}