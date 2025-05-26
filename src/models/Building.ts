import { BaseEntity, Elevator, Floor, createBuildingFloor, createBuildingElevator} from ".";
import { buildingConstants } from '../constants';

export class Building extends BaseEntity {
    protected static readonly INITIAL_TOTAL_FLOORS = buildingConstants.INITIAL_TOTAL_FLOORS;
    protected static readonly INITIAL_ELEVATORS_COUNT = buildingConstants.INITIAL_ELEVATORS_COUNT;
    protected static readonly MIN_ELEVATORS = buildingConstants.MIN_ELEVATORS;
    protected static readonly MAX_ELEVATORS = buildingConstants.MAX_ELEVATORS;
    protected static readonly MIN_FLOORS = buildingConstants.MIN_FLOORS;
    protected static readonly MAX_FLOORS = buildingConstants.MAX_FLOORS;

    public elevatorMoveListeners: ((elevatorId: number, position: number) => void)[] = [];
    public elevatorArrivalListeners: ((floorNumber: number) => void)[] = [];
    public floorAddedListeners: (()=> void)[] = [];
    public floorRemoveListeners: ((floorNumber: number) => void)[] = [];
    public elevatorAddedListeners:(()=> void)[] = [];
    public elevatorRemoveListeners: ((elevatorId: number) => void)[] = [];
    public elevatorEstimateTimeUpdate: ((elevatorId: number)=>void)[] = [];

    #floors: Floor[] = [];
    #elevators: Elevator[] = [];

    constructor(id: number, totalFloors?: number, elevatorsCount?: number){
        super(id);
        console.log(`[Building ${id}] Initializing building...`);

        // Initialize floors
        const FloorForBuilding = createBuildingFloor(this.dispatchElevatorTo.bind(this));
        const floorCount = totalFloors || 
            (this.constructor as typeof Building).INITIAL_TOTAL_FLOORS;
        
        console.log(`[Building ${id}] Creating ${floorCount} floors`);
        for (let i = 0; i < floorCount; i++) {
            const newFloor = new FloorForBuilding(i);
            // Set event callback for floor
            newFloor.setEventCallback?.(this.notifyElevatorArrival.bind(this));
            this.#floors.push(newFloor);
        }

        // Initialize elevators
        const ElevatorForBuilding = createBuildingElevator();
        const elevCount = elevatorsCount || 
            (this.constructor as typeof Building).INITIAL_ELEVATORS_COUNT;
        
        console.log(`[Building ${id}] Creating ${elevCount} elevators`);
        for (let i = 0; i < elevCount; i++) {
            const newElevator = new ElevatorForBuilding(i);
            // Set event callbacks for elevator
            newElevator.setEventCallbacks?.(
                this.notifyElevatorMove.bind(this),
                this.handleElevatorArrival.bind(this),
                this.notifyElevatorEstimateTimeUpdate.bind(this)
            );
            this.#elevators.push(newElevator);
        }
        
        console.log(`[Building ${id}] Building initialized with ${floorCount} floors and ${elevCount} elevators`);
    }

    get floors(): Floor[] {
        return this.#floors;
    }

    get elevators(): Elevator[] {
        return this.#elevators;
    }

    get totalFloors(): number {
        return this.floors.length;
    }

    getFloorByNumber(floorNumber: number): Floor | undefined {
       return this.floors.find(floor => floor.floorNumber === floorNumber);
    }

    // Add new elevator to the building
    addElevator(): boolean {
        const currentElevatorCount = this.elevators.length;
        const maxElevators = (this.constructor as typeof Building).MAX_ELEVATORS;

        if (currentElevatorCount >= maxElevators) {
            console.warn(`Cannot add elevator. Maximum elevators (${maxElevators}) reached.`);
            return false;
        }

        const ElevatorForBuilding = createBuildingElevator();
        const newElevatorId = this.elevators.length; // Next sequential ID
        const newElevator = new ElevatorForBuilding(newElevatorId);
        
        // Set event callbacks for new elevator
        newElevator.setEventCallbacks?.(
            this.notifyElevatorMove.bind(this),
            this.handleElevatorArrival.bind(this),
            this.notifyElevatorEstimateTimeUpdate.bind(this)
        );
        
        this.#elevators.push(newElevator);
        this.notifyElevatorAdded();
        console.log(`Elevator ${newElevatorId} added successfully. Total elevators: ${this.elevators.length}`);
        return true;
    }

    // Remove elevator from the building
    removeElevator(elevatorId: number): boolean {
        const minElevators = (this.constructor as typeof Building).MIN_ELEVATORS;
        const currentElevatorCount = this.elevators.length;

        if (currentElevatorCount <= minElevators) {
            console.warn(`Cannot remove elevator. Minimum elevators (${minElevators}) required.`);
            return false;
        }

        const elevatorIndex = this.elevators.findIndex(elevator => elevator.id === elevatorId);
        
        if (elevatorIndex === -1) {
            console.warn(`Elevator with ID ${elevatorId} not found.`);
            return false;
        }

        // Check if elevator is currently operating
        const elevatorToRemove = this.elevators[elevatorIndex];
        if (elevatorToRemove.isOperating) {
            console.warn(`Cannot remove elevator ${elevatorId}. Elevator is currently operating.`);
            return false;
        }

        this.#elevators.splice(elevatorIndex, 1);
        this.notifyElevatorRemove(elevatorId);
        console.log(`Elevator ${elevatorId} removed successfully. Total elevators: ${this.elevators.length}`);
        return true;
    }

    // Add new floor to the building
    addFloor(): boolean {
        const currentFloorsCount = this.floors.length;
        const maxFloors = (this.constructor as typeof Building).MAX_FLOORS;

        if (currentFloorsCount >= maxFloors) {
            console.warn(`Cannot add floor. Maximum floors (${maxFloors}) reached.`);
            return false;
        }

        const FloorForBuilding = createBuildingFloor(this.dispatchElevatorTo.bind(this));
        const newFloorNumber = this.floors.length; // Next sequential floor number
        const newFloor = new FloorForBuilding(newFloorNumber);
        
        // Set event callback for new floor
        newFloor.setEventCallback?.(this.notifyElevatorArrival.bind(this));
        
        this.#floors.push(newFloor);
        this.notifyFloorAdded();
        console.log(`Floor ${newFloorNumber} added successfully. Total floors: ${this.floors.length}`);
        return true;
    }

    // Remove the top floor from the building
    removeTopFloor(): boolean {
        const minFloors = (this.constructor as typeof Building).MIN_FLOORS;
        const currentFloorsCount = this.floors.length;

        if (currentFloorsCount <= minFloors) {
            console.warn(`Cannot remove floor. Minimum floors (${minFloors}) required.`);
            return false;
        }

        const topFloor = this.floors[this.floors.length - 1];
        
        // Check if any elevators are on top floor or have it in their queue
        const elevatorsOnTopFloor = this.elevators.filter(
            elevator => elevator.currentFloor === topFloor.floorNumber || 
                       elevator.queue.getAllRequests().includes(topFloor.floorNumber)
        );

        if (elevatorsOnTopFloor.length > 0) {
            console.warn(`Cannot remove top floor. Elevators are currently on this floor or heading to it.`);
            return false;
        }

        this.#floors.pop();
        this.notifyFloorRemove(topFloor.floorNumber);
        console.log(`Top floor removed successfully. Total floors: ${this.floors.length}`);
        return true;
    }

    // Check if elevator can be added (within max limit)
    canAddElevator(): boolean {
        return this.elevators.length < (this.constructor as typeof Building).MAX_ELEVATORS;
    }

    // Check if elevator can be removed (above min limit)
    canRemoveElevator(): boolean {
        return this.elevators.length > (this.constructor as typeof Building).MIN_ELEVATORS;
    }

    // Check if floor can be added (within max limit)
    canAddFloor(): boolean {
        return this.floors.length < (this.constructor as typeof Building).MAX_FLOORS;
    }

    // Check if floor can be removed (above min limit)
    canRemoveFloor(): boolean {
        return this.floors.length > (this.constructor as typeof Building).MIN_FLOORS;
    }

    // Get building statistics and limits
    getBuildingStats() {
        return {
            floors: {
                current: this.floors.length,
                min: (this.constructor as typeof Building).MIN_FLOORS,
                max: (this.constructor as typeof Building).MAX_FLOORS
            },
            elevators: {
                current: this.elevators.length,
                min: (this.constructor as typeof Building).MIN_ELEVATORS,
                max: (this.constructor as typeof Building).MAX_ELEVATORS
            }
        };
    }

    dispatchElevatorTo(floorNumber: number): number {
        console.log(`[Building ${this.id}] Dispatching elevator to floor ${floorNumber}`);
        
        // Check if elevator is already at this floor and not operating
        const idleElevatorAtFloor = this.elevators.find(
            elevator => elevator.currentFloor === floorNumber && !elevator.isOperating
        );

        if (idleElevatorAtFloor) {
            console.log(`[Building ${this.id}] Found idle elevator ${idleElevatorAtFloor.id} already at floor ${floorNumber}`);
            return 0;
        }

         // Find the most efficient elevator for this request
        const { bestElevator, waitTimeSeconds } = this.findMostEfficientElevator(floorNumber);
        console.log(`[Building ${this.id}] Selected elevator ${bestElevator.id} for floor ${floorNumber}, estimated wait: ${waitTimeSeconds}s`);

        // Add floor to the best elevator's queue
        bestElevator.addRequest(floorNumber);

        return waitTimeSeconds;
    }

    private findMostEfficientElevator(targetFloor: number) {
        console.log(`[Building ${this.id}] Finding most efficient elevator for floor ${targetFloor}`);
        let bestElevator = this.elevators[0]; // Default to first elevator
        let shortestTime = Infinity;

        // Check each elevator to find the one with shortest time to target floor
        for (const elevator of this.elevators) {
            const timeToFloor = elevator.getTimeToReachFloor(targetFloor);
            console.log(`[Building ${this.id}] Elevator ${elevator.id}: ${timeToFloor}s to reach floor ${targetFloor}`);
            
            if (timeToFloor < shortestTime) {
                shortestTime = timeToFloor;
                bestElevator = elevator;
            }
        }

        console.log(`[Building ${this.id}] Best elevator: ${bestElevator.id} with ${shortestTime}s wait time`);
        return { bestElevator, waitTimeSeconds: shortestTime };
    }

    // add subscribers
    onElevatorMove(callback: (elevatorId: number, position: number) => void) {
        this.elevatorMoveListeners.push(callback);
    }

    onElevatorArrival(callback: (floorNumber: number) => void) {
        this.elevatorArrivalListeners.push(callback);
    }

    onFloorAdded(callback: (() => void)) {
        this.floorAddedListeners.push(callback);
    }

    onFloorRemove(callback: (floorId: number) => void){
        this.floorRemoveListeners.push(callback);
    }

    onElevatorAdded(callback: (() => void)) {
        this.elevatorAddedListeners.push(callback);
    }

    onElevatorRemove(callback: (elevatorId: number) => void) {
        this.elevatorRemoveListeners.push(callback);
    }
    
    onElevatorEstimateTimeUpdate(callback:(elevatorId: number)=>void){
        this.elevatorEstimateTimeUpdate.push(callback)
    }

    // notify sub functions
    notifyElevatorMove(elevatorId: number, position: number) {
        console.log(`[Building ${this.id}] Notifying elevator move: Elevator ${elevatorId} at position ${position}`);
        this.elevatorMoveListeners?.forEach(callback => 
            callback(elevatorId, position)
        );
    }

    notifyElevatorArrival(floorNumber: number) {
        console.log(`[Building ${this.id}] Notifying elevator arrival at floor ${floorNumber}`);
        this.elevatorArrivalListeners?.forEach(callback => 
        callback(floorNumber)
    );
}

    notifyFloorAdded() {
        console.log(`[Building ${this.id}] Notifying floor added event`);
        this.floorAddedListeners?.forEach(callback =>
            callback()
        );
    }

    notifyFloorRemove(floorId: number) {
        console.log(`[Building ${this.id}] Notifying floor ${floorId} removed event`);
        this.floorRemoveListeners?.forEach(callback =>
            callback(floorId)
    );
}

    notifyElevatorAdded() {
        console.log(`[Building ${this.id}] Notifying elevator added event`);
        this.elevatorAddedListeners?.forEach(callback =>
            callback()
        );
    }

    notifyElevatorRemove(elevatorId: number) {
        console.log(`[Building ${this.id}] Notifying elevator ${elevatorId} removed event`);
        this.elevatorRemoveListeners?.forEach(callback =>
            callback(elevatorId)
        );
    }

    notifyElevatorEstimateTimeUpdate(elevatorId: number) {
        console.log(`[Building ${this.id}] Notifying estimate time update for elevator ${elevatorId}`);
        this.elevatorEstimateTimeUpdate?.forEach(callback =>
            callback(elevatorId)
        );
    }

    removeAllListeners(){
        console.log(`[Building ${this.id}] Removing all event listeners`);
        this.elevatorMoveListeners= [];
        this.elevatorArrivalListeners = [];
        this.floorAddedListeners = [];
        this.floorRemoveListeners = [];
        this.elevatorAddedListeners = [];
        this.elevatorRemoveListeners = [];
        this.elevatorEstimateTimeUpdate = [];
    }

    // Helper method to handle elevator arrival and notify floors
    private handleElevatorArrival(floorNumber: number): void {
        console.log(`[Building ${this.id}] Handling elevator arrival at floor ${floorNumber}`);
        
        // Find the floor and trigger its elevator arrival
        const floor = this.getFloorByNumber(floorNumber);
        if (floor && floor.isCallingToElevator) {
            console.log(`[Building ${this.id}] Floor ${floorNumber} was waiting for elevator - triggering arrival`);
            floor.triggerElevatorArrival?.();
        } else if (floor) {
            console.log(`[Building ${this.id}] Floor ${floorNumber} was not waiting for elevator`);
        } else {
            console.warn(`[Building ${this.id}] Floor ${floorNumber} not found!`);
        }
        
        // Notify building-level listeners
        this.notifyElevatorArrival(floorNumber);
    }
}