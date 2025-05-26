import { BuildingSystemManager, FloorsDisplayData, useFloorEstimateTime } from "../viewModel";
import '../styles/help.css';
export const FloorComponent = ({ buildingId, floor, manager }: { buildingId: number, floor: FloorsDisplayData, manager: BuildingSystemManager }) => {

  const handleCall = () => {
    if (!floor.isCalling) {
      manager.callElevatorToFloor(buildingId, floor.id);
    }
  };

  const estimateTime = useFloorEstimateTime(buildingId, floor.id)


  return (
    <div
      className="floor"
    >
      <button
        className="metal linear"
        style={{
          color: floor.isCalling ? "green" : "black"
        }}
        onClick={handleCall}
      >
        {floor.id}
      </button>
      {
        estimateTime > 0 && <span className="floor-timer">{estimateTime}</span> 
      }
     
    </div>
  );
};

