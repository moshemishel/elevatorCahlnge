import { BuildingSystemManager, FloorsDisplayData, useFloorEstimateTime } from "../viewModel";
import { useElevatorStore } from "../viewModel/ElevatorSystemStore";
import '../styles/help.css';
import '../styles/floor.css';

export const FloorComponent = ({ buildingId, floor, manager }: { buildingId: number, floor: FloorsDisplayData, manager: BuildingSystemManager }) => {
  
  // קבלת מצב boarding מהסטור
  const floorData = useElevatorStore(state => 
    state.buildings[buildingId]?.floors.find(f => f.id === floor.id)
  );
  
  const boardingState = floorData?.boardingState || 'none';
  const boardingTimeRemaining = floorData?.boardingTimeRemaining || 0;

  const handleCall = () => {
    // תמיד מאפשרים לחיצה - הלוגיקה תטפל במצב
    manager.callElevatorToFloor(buildingId, floor.id);
  };

  const estimateTime = useFloorEstimateTime(buildingId, floor.id);
  const displayTime = estimateTime > 0 ? estimateTime.toFixed(1) : null;

  // קביעת מצב הכפתור
  const getButtonState = () => {
    if (boardingState === 'boarding') {
      return 'boarding'; // כתום
    } else if (boardingState === 'warning') {
      return 'warning'; // מהבהב אדום
    } else if (floor.isCalling) {
      return 'calling'; // ירוק
    }
    return 'idle'; // רגיל
  };

  const buttonState = getButtonState();

  // Debug log
  if (boardingState !== 'none') {
    console.log(`[Floor ${floor.id} UI] Boarding state: ${boardingState}, time remaining: ${boardingTimeRemaining.toFixed(1)}s`);
  }

  return (
    <>
      <div className="floor">
        <button
          className={`metal linear floor-button ${buttonState}`}
          onClick={handleCall}
          disabled={false} // תמיד מאופשר - הלוגיקה במודל
        >
          {floor.id}
        </button>
        
        {/* הצגת טיימר בהתאם למצב */}
        {displayTime && floor.isCalling && boardingState === 'none' && (
          <span className="floor-timer">{displayTime}s</span>
        )}
        
        {/* הצגת זמן boarding */}
        {boardingState !== 'none' && (
          <span className={`floor-timer ${boardingState}`}>
            {boardingTimeRemaining.toFixed(1)}s
          </span>
        )}
      </div>
      {floor.id > 0 && <div className="blackline" />}
    </>
  );
};