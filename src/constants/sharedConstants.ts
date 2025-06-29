export const SHARED_BUILDING_CONSTANTS = {
  // Initial/Default values
  INITIAL_TOTAL_FLOORS: 10,
  INITIAL_ELEVATORS_COUNT: 2,
  
  // Limits
  MIN_ELEVATORS: 1,
  MAX_ELEVATORS: 5,
  MIN_FLOORS: 2,
  MAX_FLOORS: 20,
  
  // Time calculation thresholds
  ESTIMATE_TIME_UPDATE_THRESHOLD: 0.05, 
} as const;

export const SHARED_ELEVATOR_CONSTANTS = {
  INITIAL_FLOOR: 0,
  SECONDS_TO_MOVE_ONE_FLOOR: 0.5,
  SECONDS_TO_STOP_AT_FLOOR: 2,
  POSITION_UPDATE_INTERVAL_MS: 100,
  BOARDING_TIME_FRACTION: 0.75, // 75% מזמן העצירה (1.5 מתוך 2 שניות)
  WARNING_TIME_FRACTION: 0.25,  // 25% האחרונים (0.5 מתוך 2 שניות)
} as const;

export const SHARED_NEIGHBORHOOD_CONSTANTS = {
  MIN_BUILDINGS: 1,
  MAX_BUILDINGS: 5,
} as const;