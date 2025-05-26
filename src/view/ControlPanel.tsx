import { BuildingSystemManager } from "../viewModel";
import { neighborhoodViewConstants } from "../constants";
import { CounterButton } from "./CounterBtn";
import { useBuildingCount } from "../viewModel";

interface ControlPanelProps {
  buildingManager: BuildingSystemManager;
  onBuildingsChange: () => void;
}

export const ControlPanel = ({ buildingManager, onBuildingsChange }: ControlPanelProps) => {
  const buildingCount = useBuildingCount();

  const handleBuildingCountChange = (newCount: number) => {
    buildingManager.setBuildingCount(newCount);
    onBuildingsChange();
  };

  return (
    <CounterButton 
      text="Building Counter" 
      minLimit={neighborhoodViewConstants.MIN_BUILDINGS}
      maxLimit={neighborhoodViewConstants.MAX_BUILDINGS}
      count={buildingCount}
      setCount={handleBuildingCountChange}
    />
  );
};