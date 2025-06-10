import { BuildingSystemManager, FloorsDisplayData, useFloorEstimateTime } from "../viewModel";
import '../styles/help.css';
import '../styles/floor.css';

export const FloorComponent = ({ buildingId, floor, manager }: { buildingId: number, floor: FloorsDisplayData, manager: BuildingSystemManager }) => {

  const handleCall = () => {
    if (!floor.isCalling) {
      manager.callElevatorToFloor(buildingId, floor.id);
    }
  };

  const estimateTime = useFloorEstimateTime(buildingId, floor.id);

  // Format time display to show only seconds with one decimal
  const displayTime = estimateTime > 0 ? estimateTime.toFixed(1) : null;

  return (
    <div className="floor">
      <button
        className={`metal linear floor-button ${floor.isCalling ? 'calling' : ''}`}
        style={{
          color: floor.isCalling ? "green" : "black"
        }}
        onClick={handleCall}
        disabled={floor.isCalling}
      >
        {floor.id}
      </button>
      {displayTime && floor.isCalling && (
        <span className="floor-timer">{displayTime}s</span>
      )}
    </div>
  );
};