import { BuildingSystemManager, FloorsDisplayData, useFloorEstimateTime } from "../viewModel";

export const FloorComponent = ({ buildingId, floor, manager }: { buildingId: number, floor: FloorsDisplayData, manager: BuildingSystemManager }) => {

  const handleCall = () => {
    if (!floor.isCalling) {
      manager.callElevatorToFloor(buildingId, floor.id);
    }
  };

  const estimateTime = useFloorEstimateTime(buildingId, floor.id);
  const displayTime = estimateTime > 0 ? estimateTime.toFixed(1) : null;

  return (
    <>
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
      
      <div className="blackline" />
    </>
  );
};