import { useElevatorPosition } from "../viewModel";
import '../styles/elevator.css';
export const ElevatorComponent = ({ buildingId, elevatorId }: { buildingId: number; elevatorId: number }) => {

  const pxPosition = useElevatorPosition(buildingId, elevatorId);
  console.log('Position value:', pxPosition, typeof pxPosition);
  return (
    <img
      src="/elv.png"
      className="elevator"
      style={{ bottom: `${pxPosition}px`, position: 'absolute' }}
    />
  );
};