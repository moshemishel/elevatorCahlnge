# Elevator System Project - MVVM Architecture

## Overview
This project implements an efficient elevator management system using TypeScript and React, following the MVVM (Model-View-ViewModel) architectural pattern with Object-Oriented Programming principles and Design Patterns.

## Architecture Overview

### Why MVVM?
When approaching this project, I deliberated between various architectural patterns. The key challenge was managing complex state synchronization between business logic (elevator algorithms) and UI representation. While React started with class-based components (similar to our model layer), I chose MVVM because:

1. **Separation of Concerns**: The elevator's logical state (position, direction, queue) is completely separated from its visual representation (pixel position, animations)
2. **Testability**: The Model layer can be tested independently without any UI dependencies
3. **Maintainability**: Business logic changes don't affect the view layer and vice versa
4. **State Management**: The ViewModel acts as a bridge, translating between the object-oriented Model and React's functional components

### Layer Responsibilities

#### Model Layer (`src/models/`)
- Contains pure business logic for elevators, floors, and buildings
- Implements the elevator scheduling algorithm
- Manages state transitions and event emissions
- No knowledge of UI or React

#### ViewModel Layer (`src/viewModel/`)
- **BuildingBridge**: Translates between Model events and Store updates
- **BuildingSystemManager**: Orchestrates multiple buildings and provides a facade for the View
- **Store (Zustand)**: Holds the UI state in a React-friendly format
- Converts logical positions (floors) to visual positions (pixels)

#### View Layer (`src/view/`)
- React components that purely render based on Store state
- Handles user interactions and delegates to ViewModel
- Contains only presentation logic (animations, styling)

## Design Patterns Used

### 1. Factory Pattern
```typescript
class BuildingFactory {
  create(id: number, floorsCount: number, elevatorsCount: number): Building {
    // Creates building with floors and elevators
  }
}
```
**Why**: Encapsulates the complex creation logic of buildings with their nested components (floors, elevators)

### 2. Observer Pattern
```typescript
class Building extends EventEmitter {
  onElevatorMove(callback: (id: number, position: number) => void) { }
  onElevatorArrival(callback: (floor: number) => void) { }
}
```
**Why**: Enables loose coupling between Model and ViewModel through event-based communication

### 3. Bridge Pattern
```typescript
class BuildingBridge {
  constructor(buildingModel: Building, getState: () => any, setState: (partial: any) => void)
}
```
**Why**: Decouples the Model's object-oriented structure from React's functional state management

### 4. Singleton Pattern (Implicit)
```typescript
let buildingSystemManagerInstance: BuildingSystemManager | null = null;
```
**Why**: Ensures a single source of truth for the entire elevator system

### 5. Facade Pattern
```typescript
class BuildingSystemManager {
  createBuilding() { }
  removeBuilding() { }
  callElevatorToFloor() { }
}
```
**Why**: Provides a simplified interface to the complex subsystem of buildings, elevators, and floors

## OOP Principles Applied

### 1. Single Responsibility Principle (SRP)
- **Elevator**: Only manages elevator movement and state
- **Floor**: Only handles floor-specific logic and elevator calls
- **Building**: Only orchestrates floors and elevators
- **ElevatorScheduler**: Only implements the scheduling algorithm

### 2. Open/Closed Principle (OCP)
- The scheduling algorithm can be extended without modifying existing code
- New event types can be added to the EventEmitter pattern

### 3. Dependency Inversion Principle (DIP)
- High-level modules (Building) depend on abstractions (EventEmitter)
- The View depends on the ViewModel interface, not concrete implementations

### 4. Encapsulation
- Private methods and properties protect internal state
- Public interfaces expose only necessary functionality

## Key Architectural Decisions

### 1. State Duplication
While it might seem redundant to maintain state in both Model and Store, this separation provides:
- **Type Safety**: Model uses classes with methods; Store uses plain objects
- **Performance**: React components only re-render when Store changes
- **Debugging**: Can inspect business logic state separately from UI state

### 2. Event-Driven Updates
Instead of polling or direct method calls, the system uses events:
- **Decoupling**: Model doesn't know about ViewModel
- **Flexibility**: Multiple listeners can react to the same event
- **Async-Friendly**: Natural fit for elevator's time-based operations

### 3. Logical vs Visual Positioning
```typescript
// Model: Logical position (floor number as float)
elevator.currentFloor = 2.5; // Halfway between floor 2 and 3

// ViewModel: Visual position (pixels)
pixelPosition = logicalPosition * FLOOR_HEIGHT_PX;
```
This separation allows:
- Model to work with any UI scale
- Smooth animations independent of business logic
- Easy testing of movement algorithms

## Algorithm Overview

The elevator scheduling algorithm implements a modified SCAN algorithm:
1. **Direction Persistence**: Elevators continue in their current direction until no more requests
2. **Proximity Priority**: Idle elevators are assigned based on distance
3. **Load Balancing**: Requests are distributed among available elevators
4. **Time Estimation**: Real-time calculation of arrival times

## Testing Strategy

The MVVM architecture enables multiple testing levels:
1. **Unit Tests**: Model classes tested in isolation
2. **Integration Tests**: ViewModel bridges tested with mock models
3. **Visual Tests**: The View itself serves as a visual test harness

## Future Extensibility

The architecture supports:
- Different scheduling algorithms (plug in new IElevatorScheduler)
- Multiple building types (extend Building class)
- New UI frameworks (replace View layer only)
- Performance optimizations (in ViewModel layer)
- Real-time synchronization (add WebSocket to ViewModel)

## Conclusion

This MVVM implementation demonstrates how classical OOP patterns can effectively organize modern React applications. By maintaining clear boundaries between business logic, state management, and presentation, the system remains maintainable, testable, and extensible.