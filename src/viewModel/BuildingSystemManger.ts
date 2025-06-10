import { Building, BuildingFactory } from "../models";
import { BuildingBridge } from ".";
import { buildingViewConstants, elevatorViewConstants, SHARED_BUILDING_CONSTANTS } from "../constants";

export class BuildingSystemManager {
    private buildings: Map<number, Building> = new Map();
    private bridges: Map<number, BuildingBridge> = new Map();
    private readonly getStoreState: () => any;
    private readonly setStoreState: (partial: any) => void;
    private nextBuildingId: number = 1;
    private isInitialized: boolean = false;

    constructor(getState: () => any, setState: (partial: any) => void) {
        this.getStoreState = getState;
        this.setStoreState = setState;
    }

    // Initialize the manager and sync with store
    initialize(): void {
        if (this.isInitialized) return;
        
        console.log('BuildingSystemManager: Starting initialization');
        
        // Create initial building without triggering store updates
        const buildingId = this.createBuilding(
            buildingViewConstants.DEFAULT_FLOORS_COUNT, 
            SHARED_BUILDING_CONSTANTS.INITIAL_ELEVATORS_COUNT, 
            false
        );
        
        console.log(`BuildingSystemManager: Created initial building ${buildingId} with ${SHARED_BUILDING_CONSTANTS.INITIAL_ELEVATORS_COUNT} elevators`);
        
        // Now sync everything to store at once
        this.syncAllToStore();
        
        this.isInitialized = true;
        console.log('BuildingSystemManager initialized');
    }

    createBuilding(
        floorsCount: number = buildingViewConstants.DEFAULT_FLOORS_COUNT,
        elevatorsCount: number = elevatorViewConstants.MIN_ELEVATORS,
        updateStore: boolean = true
    ): number {
        const buildingId = this.nextBuildingId++;
        const buildingFactory = new BuildingFactory();
        const building = buildingFactory.create(buildingId, floorsCount, elevatorsCount);
        
        // Create bridge with delayed store connection
        const bridge = new BuildingBridge(building, this.getStoreState, this.setStoreState, !updateStore);
        
        this.buildings.set(buildingId, building);
        this.bridges.set(buildingId, bridge);
        
        if (updateStore && this.isInitialized) {
            this.initializeBuildingInStore(buildingId, building);
        }
        
        console.log(`Building ${buildingId} created with ${floorsCount} floors and ${elevatorsCount} elevators`);
        
        return buildingId;
    }

    removeBuilding(buildingId: number): boolean {
        const building = this.buildings.get(buildingId);
        const bridge = this.bridges.get(buildingId);
        
        if (!building || !bridge) {
            console.warn(`Building ${buildingId} not found`);
            return false;
        }
        
        bridge.destroy();
        
        // Update store
        this.setStoreState((state: any) => {
            const { [buildingId]: removed, ...remainingBuildings } = state.buildings;
            return {
                buildings: remainingBuildings,
            };
        });
        
        this.buildings.delete(buildingId);
        this.bridges.delete(buildingId);
        
        console.log(`Building ${buildingId} removed and cleaned up`);
        
        return true;
    }

    createMultipleBuildings(
        count: number, 
        floorsPerBuilding: number = buildingViewConstants.DEFAULT_FLOORS_COUNT, 
        elevatorsPerBuilding: number = elevatorViewConstants.MIN_ELEVATORS
    ): number[] {
        const buildingIds: number[] = [];
        
        for (let i = 0; i < count; i++) {
            const buildingId = this.createBuilding(floorsPerBuilding, elevatorsPerBuilding);
            buildingIds.push(buildingId);
        }
        
        return buildingIds;
    }

    removeAllBuildings(): void {
        const buildingIds = Array.from(this.buildings.keys());
        
        buildingIds.forEach(buildingId => {
            this.removeBuilding(buildingId);
        });
        
        console.log('All buildings removed');
    }

    setBuildingCount(
        targetCount: number, 
        floorsPerBuilding: number = buildingViewConstants.DEFAULT_FLOORS_COUNT, 
        elevatorsPerBuilding: number = elevatorViewConstants.MIN_ELEVATORS
    ): void {
        const currentCount = this.buildings.size;
        
        if (targetCount === currentCount) {
            return; 
        }
        
        if (targetCount > currentCount) {
            const toAdd = targetCount - currentCount;
            this.createMultipleBuildings(toAdd, floorsPerBuilding, elevatorsPerBuilding);
        } else {
            const buildingIds = Array.from(this.buildings.keys());
            const toRemove = currentCount - targetCount;
            
            for (let i = 0; i < toRemove; i++) {
                const buildingId = buildingIds[buildingIds.length - 1 - i];
                this.removeBuilding(buildingId);
            }
        }
        
        console.log(`Building count updated from ${currentCount} to ${targetCount}`);
    }

    getBuildingBridge(buildingId: number): BuildingBridge | undefined {
        return this.bridges.get(buildingId);
    }

    getBuildingModel(buildingId: number): Building | undefined {
        return this.buildings.get(buildingId);
    }

    getAllBuildingIds(): number[] {
        return Array.from(this.buildings.keys());
    }

    getBuildingCount(): number {
        return this.buildings.size;
    }

    callElevatorToFloor(buildingId: number, floorNumber: number): boolean {
        const building = this.buildings.get(buildingId);
        
        if (!building) {
            console.warn(`Building ${buildingId} not found`);
            return false;
        }
        
        const floor = building.getFloorByNumber(floorNumber);
        if (!floor) {
            console.warn(`Floor ${floorNumber} not found in building ${buildingId}`);
            return false;
        }
        
        // Call elevator through the floor
        const success = floor.callElevator();
        
        if (success) {
            // Update the floor calling status in store
            this.setStoreState((state: any) => {
                const storeBuilding = state.buildings[buildingId];
                if (!storeBuilding) return state;
                
                const floorIndex = storeBuilding.floors.findIndex((f: any) => f.id === floorNumber);
                if (floorIndex === -1) return state;
                
                const updatedFloors = [...storeBuilding.floors];
                updatedFloors[floorIndex] = {
                    ...updatedFloors[floorIndex],
                    isCalling: true,
                    estimateTime: floor.estimatedWaitTimeSeconds
                };
                
                return {
                    buildings: {
                        ...state.buildings,
                        [buildingId]: {
                            ...storeBuilding,
                            floors: updatedFloors
                        }
                    }
                };
            });
        }
        
        return success;
    }

    // Add floor to a specific building
    addFloorToBuilding(buildingId: number): boolean {
        const building = this.buildings.get(buildingId);
        const bridge = this.bridges.get(buildingId);
        
        if (!building || !bridge) {
            console.warn(`Building ${buildingId} not found`);
            return false;
        }
        
        const success = building.addFloor();
        
        if (success) {
            console.log(`Floor added to building ${buildingId}. Total floors: ${building.totalFloors}`);
        }
        
        return success;
    }

    // Remove floor from a specific building
    removeFloorFromBuilding(buildingId: number): boolean {
        const building = this.buildings.get(buildingId);
        const bridge = this.bridges.get(buildingId);
        
        if (!building || !bridge) {
            console.warn(`Building ${buildingId} not found`);
            return false;
        }
        
        const success = building.removeTopFloor();
        
        if (success) {
            console.log(`Floor removed from building ${buildingId}. Total floors: ${building.totalFloors}`);
        }
        
        return success;
    }

    // Add elevator to a specific building
    addElevatorToBuilding(buildingId: number): boolean {
        const building = this.buildings.get(buildingId);
        const bridge = this.bridges.get(buildingId);
        
        if (!building || !bridge) {
            console.warn(`Building ${buildingId} not found`);
            return false;
        }
        
        const success = building.addElevator();
        
        if (success) {
            console.log(`Elevator added to building ${buildingId}. Total elevators: ${building.elevators.length}`);
        }
        
        return success;
    }

    // Remove elevator from a specific building
    removeElevatorFromBuilding(buildingId: number): boolean {
        const building = this.buildings.get(buildingId);
        const bridge = this.bridges.get(buildingId);
        
        if (!building || !bridge) {
            console.warn(`Building ${buildingId} not found`);
            return false;
        }
        
        // Find the last elevator that is not operating
        const elevatorsReversed = [...building.elevators].reverse();
        const elevatorToRemove = elevatorsReversed.find(e => !e.isOperating);
        
        if (!elevatorToRemove) {
            console.warn(`No idle elevators found in building ${buildingId}`);
            return false;
        }
        
        const success = building.removeElevator(elevatorToRemove.id);
        
        if (success) {
            console.log(`Elevator removed from building ${buildingId}. Total elevators: ${building.elevators.length}`);
        }
        
        return success;
    }

    // Get building stats for UI display
    getBuildingStats(buildingId: number) {
        const building = this.buildings.get(buildingId);
        
        if (!building) {
            return null;
        }
        
        return building.getBuildingStats();
    }

    private syncAllToStore(): void {
        console.log('BuildingSystemManager: Starting sync all to store');
        const allBuildingsData: any = {};
        
        this.buildings.forEach((building, buildingId) => {
            console.log(`Syncing building ${buildingId} with ${building.elevators.length} elevators`);
            allBuildingsData[buildingId] = {
                id: buildingId,
                floors: building.floors.map(floor => ({
                    id: floor.id,
                    isCalling: floor.isCallingToElevator,
                    estimateTime: floor.estimatedWaitTimeSeconds
                })),
                elevators: building.elevators.map(elevator => ({
                    id: elevator.id,
                    pixelPosition: BuildingBridge.convertLogicalToVisual(elevator.currentFloor)
                }))
            };
        });
        
        // Single store update with all buildings
        this.setStoreState(() => ({
            buildings: allBuildingsData
        }));

        // Now enable bridge events and sync
        this.bridges.forEach((bridge, buildingId) => {
            bridge.enableEvents();
            bridge.initialSync();
        });
        
        console.log('BuildingSystemManager: Sync completed');
    }

    private initializeBuildingInStore(buildingId: number, building: Building): void {
        const buildingData = {
            id: buildingId,
            floors: building.floors.map(floor => ({
                id: floor.id,
                isCalling: floor.isCallingToElevator,
                estimateTime: floor.estimatedWaitTimeSeconds
            })),
            elevators: building.elevators.map(elevator => ({
                id: elevator.id,
                pixelPosition: BuildingBridge.convertLogicalToVisual(elevator.currentFloor)
            }))
        };
        
        this.setStoreState((state: any) => ({
            buildings: {
                ...state.buildings,
                [buildingId]: buildingData
            }
        }));
    }

    destroy(): void {
        this.removeAllBuildings();
        this.isInitialized = false;
        console.log('BuildingSystemManager destroyed');
    }
}

let buildingSystemManagerInstance: BuildingSystemManager | null = null;

export const createBuildingSystemManager = (getState: () => any, setState: (partial: any) => void): BuildingSystemManager => {
    if (buildingSystemManagerInstance) {
        buildingSystemManagerInstance.destroy();
    }
    
    buildingSystemManagerInstance = new BuildingSystemManager(getState, setState);
    return buildingSystemManagerInstance;
};

export const getBuildingSystemManager = (): BuildingSystemManager | null => {
    return buildingSystemManagerInstance;
};