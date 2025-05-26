import { BuildingSystemManager, useBuilding } from "../viewModel";
import { ElevatorComponent, FloorComponent } from "./";
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
  
  return (
    <div className="building-wrapper">

      <div className="floors-elevators-wrapper">
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
        
        <div className="elevators-container">
          {building.elevators.map(elevator => (
            <ElevatorComponent 
              key={elevator.id} 
              buildingId={buildingId} 
              elevatorId={elevator.id} 
            />
          ))}
        </div>
      </div>
    </div>
  );
};