import { BuildingSystemManager, useBuilding } from "../viewModel";
import { ElevatorComponent, FloorComponent, CounterButton } from "./";
import '../styles/containers.css'

interface BuildingComponentProps {
  buildingId: number;
  manager: BuildingSystemManager;
}

export const BuildingComponent = ({ buildingId, manager }: BuildingComponentProps) => {
  const building = useBuilding(buildingId);
  
  if (!building) {
    return null;
  }
  
  const handleFloorsChange = (newCount: number) => {
    const currentCount = building.floors.length;
    
    if (newCount > currentCount) {
      // Add floors
      for (let i = 0; i < newCount - currentCount; i++) {
        manager.addFloorToBuilding(buildingId);
      }
    } else if (newCount < currentCount) {
      // Remove floors
      for (let i = 0; i < currentCount - newCount; i++) {
        manager.removeFloorFromBuilding(buildingId);
      }
    }
  };

  const handleElevatorsChange = (newCount: number) => {
    const currentCount = building.elevators.length;
    
    if (newCount > currentCount) {
      // Add elevators
      for (let i = 0; i < newCount - currentCount; i++) {
        manager.addElevatorToBuilding(buildingId);
      }
    } else if (newCount < currentCount) {
      // Remove elevators
      for (let i = 0; i < currentCount - newCount; i++) {
        manager.removeElevatorFromBuilding(buildingId);
      }
    }
  };

  const stats = manager.getBuildingStats(buildingId);
  
  return (
    <div className="building-container">
      <div className="building-main">
        <div className="building-section">
          <div className="floors-container">
            {building.floors.map(floor => (
              <FloorComponent 
                key={floor.id} 
                buildingId={buildingId} 
                floor={floor} 
                manager={manager}
              />
            ))}
          </div>
          <CounterButton 
            text="Floors" 
            minLimit={stats?.floors.min || 2}
            maxLimit={stats?.floors.max || 20}
            count={building.floors.length}
            setCount={handleFloorsChange}
          />
        </div>
        
        <div className="elevators-section">
          <div className="elevators-container">
            {building.elevators.map(elevator => (
              <ElevatorComponent 
                key={elevator.id} 
                buildingId={buildingId} 
                elevatorId={elevator.id} 
                totalFloors={building.floors.length}
              />
            ))}
          </div>
          <CounterButton 
            text="Elevators" 
            minLimit={stats?.elevators.min || 1}
            maxLimit={stats?.elevators.max || 5}
            count={building.elevators.length}
            setCount={handleElevatorsChange}
          />
        </div>
      </div>
    </div>
  );
};