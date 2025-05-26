import { useEffect, useState } from "react";
import { BuildingSystemManager, useElevatorStore } from "../viewModel";
import '../styles/index.css';
import { BuildingComponent, ControlPanel } from ".";

export const ElevatorApp = () => {
  // שימוש ב-useState רגיל עבור המנג'ר
  const [manager] = useState<BuildingSystemManager>(() => 
    new BuildingSystemManager(
      () => useElevatorStore.getState(), 
      useElevatorStore.setState
    )
  );

  // שימוש ב-useState עבור רשימת מזהי הבניינים - מנותק מהסטור הגלובלי
  const [buildingIds, setBuildingIds] = useState<number[]>([]);

  // אתחול המנג'ר רק פעם אחת
  useEffect(() => {
    manager.initialize();
    
    // קבלת רשימת הבניינים הראשונית אחרי האתחול
    const initialIds = manager.getAllBuildingIds();
    setBuildingIds(initialIds);
  }, [manager]); 

  // פונקציה לעדכון רשימת הבניינים (תיקרא מה-ControlPanel)
  const updateBuildingIds = () => {
    const currentIds = manager.getAllBuildingIds();
    setBuildingIds(currentIds);
  };

  // ניקוי בעת unmount
  useEffect(() => {
    return () => {
      manager.destroy();
    };
  }, [manager]);

  return (
    <div className="app-wrapper">
      <ControlPanel 
        buildingManager={manager} 
        onBuildingsChange={updateBuildingIds}
      />
      <div className="buildings-container">
        {buildingIds.map(buildingId => (
          <BuildingComponent 
            key={buildingId} 
            buildingId={buildingId} 
            manager={manager} 
          />
        ))}
      </div>
    </div>
  );
};