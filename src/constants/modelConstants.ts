export const elevatorConstants = {
  INITIAL_FLOOR: 0,
  SECONDS_TO_MOVE_ONE_FLOOR: 0.5,
  SECONDS_TO_STOP_AT_FLOOR: 2
} as const;

export const buildingConstants = {
  INITIAL_TOTAL_FLOORS: 10,
  INITIAL_ELEVATORS_COUNT: 2,
  MIN_ELEVATORS: 1,
  MAX_ELEVATORS: 5,
  MIN_FLOORS: 2,
  MAX_FLOORS: 20,
} as const;