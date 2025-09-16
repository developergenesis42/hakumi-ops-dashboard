import type { Therapist, Session, Room, Service, WalkOut } from '@/types';

export interface NormalizedState<T> {
  byId: Record<string, T>;
  allIds: string[];
}

export interface NormalizedAppState {
  therapists: NormalizedState<Therapist>;
  sessions: NormalizedState<Session>;
  rooms: NormalizedState<Room>;
  services: NormalizedState<Service>;
  walkOuts: NormalizedState<WalkOut>;
  todayRoster: string[]; // Array of therapist IDs
}

/**
 * Normalize an array of entities into a normalized state
 */
export function normalizeEntities<T extends { id: string }>(entities: T[]): NormalizedState<T> {
  const byId: Record<string, T> = {};
  const allIds: string[] = [];

  entities.forEach(entity => {
    byId[entity.id] = entity;
    allIds.push(entity.id);
  });

  return { byId, allIds };
}

/**
 * Denormalize a normalized state back to an array
 */
export function denormalizeEntities<T>(normalizedState: NormalizedState<T>): T[] {
  return normalizedState.allIds.map(id => normalizedState.byId[id]);
}

/**
 * Get a single entity by ID from normalized state
 */
export function getEntityById<T>(normalizedState: NormalizedState<T>, id: string): T | undefined {
  return normalizedState.byId[id];
}

/**
 * Get multiple entities by IDs from normalized state
 */
export function getEntitiesByIds<T>(normalizedState: NormalizedState<T>, ids: string[]): T[] {
  return ids.map(id => normalizedState.byId[id]).filter(Boolean);
}

/**
 * Add an entity to normalized state
 */
export function addEntity<T extends { id: string }>(
  normalizedState: NormalizedState<T>, 
  entity: T
): NormalizedState<T> {
  if (normalizedState.byId[entity.id]) {
    // Entity already exists, update it
    return updateEntity(normalizedState, entity);
  }

  return {
    byId: {
      ...normalizedState.byId,
      [entity.id]: entity
    },
    allIds: [...normalizedState.allIds, entity.id]
  };
}

/**
 * Update an entity in normalized state
 */
export function updateEntity<T extends { id: string }>(
  normalizedState: NormalizedState<T>, 
  entity: T
): NormalizedState<T> {
  if (!normalizedState.byId[entity.id]) {
    // Entity doesn't exist, add it
    return addEntity(normalizedState, entity);
  }

  return {
    ...normalizedState,
    byId: {
      ...normalizedState.byId,
      [entity.id]: entity
    }
  };
}

/**
 * Remove an entity from normalized state
 */
export function removeEntity<T>(
  normalizedState: NormalizedState<T>, 
  id: string
): NormalizedState<T> {
  const { [id]: _removed, ...remainingById } = normalizedState.byId;
  // _removed is intentionally unused - we only want the remaining items
  void _removed; // Suppress unused variable warning
  
  return {
    byId: remainingById,
    allIds: normalizedState.allIds.filter(entityId => entityId !== id)
  };
}

/**
 * Update multiple entities in normalized state
 */
export function updateEntities<T extends { id: string }>(
  normalizedState: NormalizedState<T>, 
  entities: T[]
): NormalizedState<T> {
  const updatedById = { ...normalizedState.byId };
  const newIds: string[] = [];

  entities.forEach(entity => {
    updatedById[entity.id] = entity;
    if (!normalizedState.allIds.includes(entity.id)) {
      newIds.push(entity.id);
    }
  });

  return {
    byId: updatedById,
    allIds: [...normalizedState.allIds, ...newIds]
  };
}

/**
 * Create selectors for normalized state
 */
export function createSelectors<T>(normalizedState: NormalizedState<T>) {
  return {
    getAll: () => denormalizeEntities(normalizedState),
    getById: (id: string) => getEntityById(normalizedState, id),
    getByIds: (ids: string[]) => getEntitiesByIds(normalizedState, ids),
    getCount: () => normalizedState.allIds.length,
    getIds: () => normalizedState.allIds,
    hasId: (id: string) => id in normalizedState.byId
  };
}

/**
 * Create a normalized state from the current app state
 */
export function createNormalizedAppState(appState: {
  therapists: Therapist[];
  sessions: Session[];
  rooms: Room[];
  services: Service[];
  walkOuts: WalkOut[];
  todayRoster: Therapist[];
}): NormalizedAppState {
  return {
    therapists: normalizeEntities(appState.therapists),
    sessions: normalizeEntities(appState.sessions),
    rooms: normalizeEntities(appState.rooms),
    services: normalizeEntities(appState.services),
    walkOuts: normalizeEntities(appState.walkOuts),
    todayRoster: appState.todayRoster.map(therapist => therapist.id)
  };
}

/**
 * Convert normalized state back to regular app state format
 */
export function denormalizeAppState(normalizedState: NormalizedAppState): {
  therapists: Therapist[];
  sessions: Session[];
  rooms: Room[];
  services: Service[];
  walkOuts: WalkOut[];
  todayRoster: Therapist[];
} {
  return {
    therapists: denormalizeEntities(normalizedState.therapists),
    sessions: denormalizeEntities(normalizedState.sessions),
    rooms: denormalizeEntities(normalizedState.rooms),
    services: denormalizeEntities(normalizedState.services),
    walkOuts: denormalizeEntities(normalizedState.walkOuts),
    todayRoster: getEntitiesByIds(normalizedState.therapists, normalizedState.todayRoster)
  };
}

/**
 * Create a memoized selector for derived state
 */
export function createDerivedSelector<T, R>(
  selector: (state: T) => R,
  dependencies: (state: T) => unknown[]
) {
  let lastResult: R;
  let lastDependencies: unknown[];

  return (state: T): R => {
    const currentDependencies = dependencies(state);
    
    // Check if dependencies have changed
    if (!lastDependencies || 
        currentDependencies.length !== lastDependencies.length ||
        currentDependencies.some((dep, index) => dep !== lastDependencies[index])) {
      lastResult = selector(state);
      lastDependencies = currentDependencies;
    }
    
    return lastResult;
  };
}

/**
 * Normalize therapists array into normalized state
 */
export function normalizeTherapists(therapists: Therapist[]): NormalizedState<Therapist> {
  return normalizeEntities(therapists);
}

/**
 * Select a therapist by ID from normalized state
 */
export function selectTherapistById(normalizedState: NormalizedState<Therapist>, id: string): Therapist | undefined {
  return getEntityById(normalizedState, id);
}

/**
 * Example selectors for common queries
 */
export const createAppSelectors = (state: NormalizedAppState) => ({
  // Get all available therapists
  getAvailableTherapists: () => {
    const allTherapists = denormalizeEntities(state.therapists);
    return allTherapists.filter(therapist => therapist.status === 'available');
  },

  // Get therapists currently in session
  getTherapistsInSession: () => {
    const allTherapists = denormalizeEntities(state.therapists);
    return allTherapists.filter(therapist => therapist.status === 'in-session');
  },

  // Get sessions for a specific therapist
  getSessionsForTherapist: (therapistId: string) => {
    const allSessions = denormalizeEntities(state.sessions);
    return allSessions.filter(session => session.therapistIds.includes(therapistId));
  },

  // Get active sessions
  getActiveSessions: () => {
    const allSessions = denormalizeEntities(state.sessions);
    return allSessions.filter(session => session.status === 'in_progress');
  },

  // Get available rooms
  getAvailableRooms: () => {
    const allRooms = denormalizeEntities(state.rooms);
    return allRooms.filter(room => room.status === 'available');
  },

  // Get occupied rooms
  getOccupiedRooms: () => {
    const allRooms = denormalizeEntities(state.rooms);
    return allRooms.filter(room => room.status === 'occupied');
  },

  // Get services by category
  getServicesByCategory: (category: string) => {
    const allServices = denormalizeEntities(state.services);
    return allServices.filter(service => service.category === category);
  },

  // Get today's roster with full therapist data
  getTodayRosterWithData: () => {
    return getEntitiesByIds(state.therapists, state.todayRoster);
  }
});