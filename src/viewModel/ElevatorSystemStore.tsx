import { create } from 'zustand';
import { ElevatorSystemStore } from '.';

export const useElevatorStore = create<ElevatorSystemStore>((set, get) => ({
  // Initial State
  buildings: {},
  
  // Building Management
  addBuilding: (buildingId, building) => {
    set((state) => ({
      buildings: {
        ...state.buildings,
        [buildingId]: { ...building }
      }
    }));
  },
  
  removeBuilding: (buildingId) => {
    set((state) => {
      const { [buildingId]: removed, ...remainingBuildings } = state.buildings;
      return {
        buildings: remainingBuildings,
      };
    });
  },
  
    // Floor Management
    addFloor: (buildingId, floor) => {
        set((state) => {
            const building = state.buildings[buildingId];
            if (!building) return state; 

            return {
            buildings: {
                ...state.buildings,
                [buildingId]: {
                ...building,
                floors: [...building.floors, floor]
                }
            }
        };
    });
},

  removeFloor: (buildingId, floorId) => {
    set((state) => {
        const building = state.buildings[buildingId];
        if (!building) return state; 

    return {
      buildings: {
        ...state.buildings,
        [buildingId]: {
          ...building,
          floors: building.floors.filter((floor) => floor.id !== floorId)
        }
      }
    };
  });
},

updateFloorCallingStatus: (buildingId: number, floorId: number, isCalling: boolean) => {
  set((state) => {
    const building = state.buildings[buildingId];
    if (!building) return state;
    
    const floorIndex = building.floors.findIndex(f => f.id === floorId);
    if (floorIndex === -1) return state;
    
    const updatedFloors = [...building.floors];
    updatedFloors[floorIndex] = {
      ...updatedFloors[floorIndex], 
      isCalling
    };
    
    return {
      buildings: {
        ...state.buildings,
        [buildingId]: {
          ...building,
          floors: updatedFloors
        }
      }
    };
  });
},
  
  // Elevator Management
  addElevator: (buildingId, elevator) => {
    set((state) => {
      const building = state.buildings[buildingId];
      if (!building) return state;
      
      return {
        buildings: {
          ...state.buildings,
          [buildingId]: {
            ...building,
            elevators: [...building.elevators, { ...elevator }]
          }
        }
      };
    });
  },
  
  removeElevator: (buildingId, elevatorId) => {
    set((state) => {
      const building = state.buildings[buildingId];
      if (!building) return state;
      
      return {
        buildings: {
          ...state.buildings,
          [buildingId]: {
            ...building,
            elevators: building.elevators.filter(e => e.id !== elevatorId)
          }
        }
      };
    });
  },
  
  updateElevatorPosition: (buildingId, elevatorId, pixelPosition) => {
    set((state) => {
      const building = state.buildings[buildingId];
      if (!building) return state;
      
      const elevatorIndex = building.elevators.findIndex(e => e.id === elevatorId);
      if (elevatorIndex === -1) return state;
      
      const updatedElevators = [...building.elevators];
      updatedElevators[elevatorIndex] = {
        ...updatedElevators[elevatorIndex],
        pixelPosition,
      };
      
      return {
        buildings: {
          ...state.buildings,
          [buildingId]: {
            ...building,
            elevators: updatedElevators
          }
        }
      };
    });
  },
  
 
  // Utility Selectors
  getBuildingById: (buildingId) => {
    return get().buildings[buildingId];
  },
  
  getBuildingElevators: (buildingId) => {
    const building = get().buildings[buildingId];
    return building?.elevators || [];
  }
}));


// Custom hooks for specific selections (performance optimization)
export const useBuilding = (buildingId: number) => 
  useElevatorStore(state => state.buildings[buildingId]);

export const useBuildingElevators = (buildingId: number) => 
  useElevatorStore(state => state.buildings[buildingId]?.elevators || []);

export const useElevatorPosition = (buildingId: number, elevatorId: number) => 
  useElevatorStore(state => {
    const building = state.buildings[buildingId];
    const elevator = building?.elevators.find(e => e.id === elevatorId);
    return elevator?.pixelPosition || 0;
  });

export const useBuildingCount = () => 
  useElevatorStore(state => Object.keys(state.buildings).length);

export const useFloorEstimateTime = (buildingId: number, floorId: number) => 
  useElevatorStore(state => {
    const building = state.buildings[buildingId];
    const floor = building?.floors.find(f => f.id === floorId);
    return floor?.estimateTime || 0;
  });