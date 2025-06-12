import { useElevatorPosition } from "../viewModel";
import '../styles/elevator.css';
import { buildingViewConstants } from "../constants";

interface ElevatorComponentProps {
  buildingId: number;
  elevatorId: number;
  totalFloors: number;
}

export const ElevatorComponent = ({ buildingId, elevatorId, totalFloors }: ElevatorComponentProps) => {
  const pxPosition = useElevatorPosition(buildingId, elevatorId);
  
  // Calculate the total height of the elevator shaft based on number of floors
  const shaftHeight = totalFloors * buildingViewConstants.FLOOR_PX_HEIGHT; // 110px per floor
  
  return (
    <div className="elevator-shaft" style={{ height: `${shaftHeight}px` }}>
      <img
        src="/elv.png"
        className="elevator"
        style={{ bottom: `${pxPosition}px` }}
        alt={`Elevator ${elevatorId}`}
      />
    </div>
  );
};