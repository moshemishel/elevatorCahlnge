import { Building, Elevator, Floor  } from "./";
import {ElevatorDispatcher, Factory} from './types'


// *Factory Function* that returns a special Elevator class for a Building
export function createBuildingElevator() {
  return class BuildingElevator extends Elevator {
  }
}

// *Factory Function* that returns a special Floor class for a Building
// Takes an elevator dispatcher and returns an extended Floor class with static access of building dispatcher
export function createBuildingFloor(elevatorDispatcher: ElevatorDispatcher) {
  return class BuildingFloor extends Floor {
    protected static readonly elevatorDispatcherFromBuilding = elevatorDispatcher;
  }
}

// *Factory Class* for creating Building instances
// Implements the Factory interface and provides a method for creating new Building instances
export class BuildingFactory implements Factory<Building, [number, number, number]> {
  create(id: number, totalFloors: number, elevatorsCount: number): Building {
    return new Building(id, totalFloors, elevatorsCount);
  }
}