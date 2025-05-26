import { buildingViewConstants } from "../constants";
import { Building } from "../models";

export class BuildingBridge {
    protected static readonly FLOOR_PX_HEIGHT = buildingViewConstants.FLOOR_PX_HEIGHT
    
    static convertLogicalToVisual(logicalPosition: number) {
        return Math.round(logicalPosition * BuildingBridge.FLOOR_PX_HEIGHT);
    }
    
    protected static dingSound = new Audio("/ding.mp3");
    protected static playDingSound = () => { 
        BuildingBridge.dingSound.play().catch(e => console.error("error in play ding:", e));
    }

    readonly buildingModel: Building;
    private readonly getStoreState: () => any;
    private readonly setStoreState: (partial: any) => void;
    private eventsEnabled: boolean = true;
    
    constructor(buildingModel: Building, getState: () => any, setState: (partial: any) => void, disableEvents: boolean = false) {
        this.buildingModel = buildingModel;
        this.getStoreState = getState;
        this.setStoreState = setState;
        this.eventsEnabled = !disableEvents;
        
        this.subscribeToModelEvents();
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
                isCalling: false
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
        this.syncFloors();
        this.syncElevators();
    }

    destroy() {
        this.buildingModel.removeAllListeners();
    }
}