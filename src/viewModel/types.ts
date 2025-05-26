import { useElevatorStore } from ".";

export interface ElevatorDisplayData {
    id: number;
    pixelPosition: number;
}

export interface FloorsDisplayData {
    id: number;
    isCalling: boolean;
    estimateTime: number;
}

export interface BuildingDisplayData {
    floors: FloorsDisplayData[];
    elevators: ElevatorDisplayData[];
}

export interface ElevatorSystemStore {
    // State
    buildings: Record<string, BuildingDisplayData>;

    // Building Actions
    addBuilding: (buildingId: number, building: BuildingDisplayData) => void;
    removeBuilding: (buildingId: number) => void;

    // Floor Actions
    addFloor: (buildingId: number, floor: FloorsDisplayData) => void;
    removeFloor: (buildingId: number, floorId: number) => void;
    updateFloorCallingStatus: (buildingId: number, floorId: number, isCalling: boolean) => void;

    

    // Elevator Actions
    addElevator: (buildingId: number, elevator: ElevatorDisplayData) => void;
    removeElevator: (buildingId: number, elevatorId: number) => void;
    updateElevatorPosition: (buildingId: number, elevatorId: number, pixelPosition: number) => void;

    // Utility Selectors
    getBuildingById: (buildingId: number) => BuildingDisplayData | undefined;
}

export type ElevatorStore = typeof useElevatorStore;