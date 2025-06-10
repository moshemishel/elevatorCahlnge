import { buildingViewConstants } from "../constants";
import { Building } from "../models";

export class BuildingBridge {
    protected static readonly FLOOR_PX_HEIGHT = buildingViewConstants.FLOOR_PX_HEIGHT
    
    static convertLogicalToVisual(logicalPosition: number) {
        return Math.round(logicalPosition * BuildingBridge.FLOOR_PX_HEIGHT);
    }
    
    // Create multiple audio instances to handle concurrent sounds
    protected static dingSounds: HTMLAudioElement[] = [];
    protected static currentSoundIndex = 0;
    
    static initializeSounds() {
        // Create 5 audio instances for concurrent playback
        for (let i = 0; i < 5; i++) {
            const audio = new Audio("/ding.mp3");
            audio.preload = 'auto';
            BuildingBridge.dingSounds.push(audio);
        }
    }
    
    protected static playDingSound = () => { 
        if (BuildingBridge.dingSounds.length === 0) {
            BuildingBridge.initializeSounds();
        }
        
        // Use round-robin to play different instances
        const audio = BuildingBridge.dingSounds[BuildingBridge.currentSoundIndex];
        BuildingBridge.currentSoundIndex = (BuildingBridge.currentSoundIndex + 1) % BuildingBridge.dingSounds.length;
        
        // Clone and play to handle overlapping sounds
        audio.cloneNode(true).play().catch(e => console.error("error in play ding:", e));
    }

    readonly buildingModel: Building;
    private readonly getStoreState: () => any;
    private readonly setStoreState: (partial: any) => void;
    private eventsEnabled: boolean = true;
    private estimateTimeInterval: number | null = null;
    
    constructor(buildingModel: Building, getState: () => any, setState: (partial: any) => void, disableEvents: boolean = false) {
        this.buildingModel = buildingModel;
        this.getStoreState = getState;
        this.setStoreState = setState;
        this.eventsEnabled = !disableEvents;
        
        // Initialize sounds on first bridge creation
        if (BuildingBridge.dingSounds.length === 0) {
            BuildingBridge.initializeSounds();
        }
        
        this.subscribeToModelEvents();
        this.startEstimateTimeUpdater();
    }

    get buildingId(){
        return this.buildingModel.id;
    }

    enableEvents(): void {
        this.eventsEnabled = true;
        console.log(`Bridge events enabled for building ${this.buildingId}`);
    }

    disableEvents(): void {
        this.eventsEnabled = false;
        console.log(`Bridge events disabled for building ${this.buildingId}`);
    }

    subscribeToModelEvents() {
        this.buildingModel.onElevatorMove((elevatorId, logicalPosition) => {
            if (this.eventsEnabled) {
                this.handleElevatorMove(elevatorId, logicalPosition);
            }
        });
        
        this.buildingModel.onElevatorArrival((floorNumber) => {
            if (this.eventsEnabled) {
                this.handleElevatorArrival(floorNumber);
            }
        });
        
        this.buildingModel.onFloorAdded(() => {
            if (this.eventsEnabled) {
                this.handleFloorAdded();
            }
        });
        
        this.buildingModel.onFloorRemove((floorId) => {
            if (this.eventsEnabled) {
                this.handleFloorRemove(floorId);
            }
        });
        
        this.buildingModel.onElevatorAdded(() => {
            if (this.eventsEnabled) {
                this.handleElevatorAdded();
            }
        });
        
        this.buildingModel.onElevatorRemove((elevatorId) => {
            if (this.eventsEnabled) {
                this.handleElevatorRemove(elevatorId);
            }
        });
        
        this.buildingModel.onElevatorEstimateTimeUpdate((elevatorId) => {
            if (this.eventsEnabled) {
                this.handleElevatorEstimateTimeUpdate(elevatorId);
            }
        });
    }

    private handleElevatorMove(elevatorId: number, logicalPosition: number) {
        const pixelPosition = BuildingBridge.convertLogicalToVisual(logicalPosition);
        console.log(`🔥 HandleElevatorMove - Elevator ${elevatorId}, Logical: ${logicalPosition}, Pixel: ${pixelPosition}`);
        
        this.setStoreState((state: any) => {
            const building = state.buildings[this.buildingId];
            if (!building) return state;
            
            const elevatorIndex = building.elevators.findIndex((e: any) => e.id === elevatorId);
            if (elevatorIndex === -1) return state;
            
            const updatedElevators = [...building.elevators];
            updatedElevators[elevatorIndex] = {
                ...updatedElevators[elevatorIndex],
                pixelPosition,
            };
            
            return {
                buildings: {
                    ...state.buildings,
                    [this.buildingId]: {
                        ...building,
                        elevators: updatedElevators
                    }
                }
            };
        });
    }

    private handleElevatorArrival(floorNumber: number) {   
        BuildingBridge.playDingSound();
        
        this.setStoreState((state: any) => {
            const building = state.buildings[this.buildingId];
            if (!building) return state;
            
            const floorIndex = building.floors.findIndex((f: any) => f.id === floorNumber);
            if (floorIndex === -1) return state;
            
            const updatedFloors = [...building.floors];
            updatedFloors[floorIndex] = {
                ...updatedFloors[floorIndex], 
                isCalling: false,
                estimateTime: 0
            };
            
            return {
                buildings: {
                    ...state.buildings,
                    [this.buildingId]: {
                        ...building,
                        floors: updatedFloors
                    }
                }
            };
        });
    }

    private handleFloorAdded() {
        const floors = this.buildingModel.floors; 
        const newFloor = floors[floors.length - 1]; 
        
        this.setStoreState((state: any) => {
            const building = state.buildings[this.buildingId];
            if (!building) return state; 

            return {
                buildings: {
                    ...state.buildings,
                    [this.buildingId]: {
                        ...building,
                        floors: [...building.floors, {
                            id: newFloor.id, 
                            isCalling: newFloor.isCallingToElevator, 
                            estimateTime: newFloor.estimatedWaitTimeSeconds
                        }]
                    }
                }
            };
        });
    }

    private handleElevatorAdded() {
        const elevators = this.buildingModel.elevators; 
        const newElevator = elevators[elevators.length - 1]; 
        const pxPos = BuildingBridge.convertLogicalToVisual(newElevator.currentFloor);
        
        this.setStoreState((state: any) => {
            const building = state.buildings[this.buildingId];
            if (!building) return state;
            
            return {
                buildings: {
                    ...state.buildings,
                    [this.buildingId]: {
                        ...building,
                        elevators: [...building.elevators, {
                            id: newElevator.id, 
                            pixelPosition: pxPos
                        }]
                    }
                }
            };
        });
    }

    private handleFloorRemove(floorId: number) {
        this.setStoreState((state: any) => {
            const building = state.buildings[this.buildingId];
            if (!building) return state; 

            return {
                buildings: {
                    ...state.buildings,
                    [this.buildingId]: {
                        ...building,
                        floors: building.floors.filter((floor: any) => floor.id !== floorId)
                    }
                }
            };
        });
    }

    private handleElevatorRemove(elevatorId: number) {
        this.setStoreState((state: any) => {
            const building = state.buildings[this.buildingId];
            if (!building) return state;
            
            return {
                buildings: {
                    ...state.buildings,
                    [this.buildingId]: {
                        ...building,
                        elevators: building.elevators.filter((e: any) => e.id !== elevatorId)
                    }
                }
            };
        });
    }

    private handleElevatorEstimateTimeUpdate(elevatorId: number) {
        console.log(`[BuildingBridge ${this.buildingId}] Handling estimate time update for elevator ${elevatorId}`);
        
        // Update all floors' estimate times
        this.setStoreState((state: any) => {
            const building = state.buildings[this.buildingId];
            if (!building) return state;
            
            const updatedFloors = building.floors.map((floor: any) => {
                const modelFloor = this.buildingModel.getFloorByNumber(floor.id);
                if (!modelFloor || !modelFloor.isCallingToElevator) return floor;
                
                return {
                    ...floor,
                    estimateTime: modelFloor.estimatedWaitTimeSeconds
                };
            });
            
            return {
                buildings: {
                    ...state.buildings,
                    [this.buildingId]: {
                        ...building,
                        floors: updatedFloors
                    }
                }
            };
        });
    }

    addFloor() {
        this.buildingModel.addFloor();
    }

    addElevator() {
        this.buildingModel.addElevator();
    }

    private syncFloors() {
        const modelFloors = this.buildingModel.floors;
        const currentState = this.getStoreState();
        const storeBuilding = currentState.buildings[this.buildingId];
        
        if (storeBuilding) {
            this.setStoreState((state: any) => ({
                buildings: {
                    ...state.buildings,
                    [this.buildingId]: {
                        ...state.buildings[this.buildingId],
                        floors: modelFloors.map(floor => ({
                            id: floor.id,
                            isCalling: floor.isCallingToElevator,
                            estimateTime: floor.estimatedWaitTimeSeconds
                        }))
                    }
                }
            }));
        }
    }
    
    private syncElevators() {
        const modelElevators = this.buildingModel.elevators;
        const currentState = this.getStoreState();
        const storeBuilding = currentState.buildings[this.buildingId];
        
        if (storeBuilding) {
            this.setStoreState((state: any) => ({
                buildings: {
                    ...state.buildings,
                    [this.buildingId]: {
                        ...state.buildings[this.buildingId],
                        elevators: modelElevators.map(elevator => ({
                            id: elevator.id,
                            pixelPosition: BuildingBridge.convertLogicalToVisual(elevator.currentFloor || 0)
                        }))
                    }
                }
            }));
        }
    }

    initialSync() {
        console.log(`[BuildingBridge ${this.buildingId}] Starting initial sync`);
        this.syncFloors();
        this.syncElevators();
        console.log(`[BuildingBridge ${this.buildingId}] Initial sync completed`);
    }

    private startEstimateTimeUpdater() {
        // Update estimate times every 100ms
        this.estimateTimeInterval = setInterval(() => {
            if (!this.eventsEnabled) return;
            
            this.setStoreState((state: any) => {
                const building = state.buildings[this.buildingId];
                if (!building) return state;
                
                let hasChanges = false;
                const updatedFloors = building.floors.map((floor: any) => {
                    const modelFloor = this.buildingModel.getFloorByNumber(floor.id);
                    if (!modelFloor || !modelFloor.isCallingToElevator) {
                        if (floor.estimateTime > 0) {
                            hasChanges = true;
                            return { ...floor, estimateTime: 0 };
                        }
                        return floor;
                    }
                    
                    const newEstimateTime = Math.max(0, modelFloor.estimatedWaitTimeSeconds);
                    if (Math.abs(floor.estimateTime - newEstimateTime) > 0.01) {
                        hasChanges = true;
                        return {
                            ...floor,
                            estimateTime: newEstimateTime
                        };
                    }
                    return floor;
                });
                
                if (!hasChanges) return state;
                
                return {
                    buildings: {
                        ...state.buildings,
                        [this.buildingId]: {
                            ...building,
                            floors: updatedFloors
                        }
                    }
                };
            });
        }, 100);
    }

    destroy() {
        if (this.estimateTimeInterval !== null) {
            clearInterval(this.estimateTimeInterval);
            this.estimateTimeInterval = null;
        }
        this.buildingModel.removeAllListeners();
    }
}