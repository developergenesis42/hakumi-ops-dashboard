/**
 * Enhanced Services Index
 * Exports all enhanced services using the new centralized architecture
 */

export { TherapistService } from './TherapistService';
export { SessionService } from './SessionService';
export { RosterService } from './RosterService';

// Re-export base classes and types
export { 
  BaseService, 
  ServiceError, 
  NetworkError, 
  TimeoutError, 
  ValidationError, 
  NotFoundError,
  RequestConfig 
} from '@/services/base/BaseService';

export { ApiClient } from '@/services/base/ApiClient';
export { ServiceFactory, getServiceFactory, getService, getApiClient } from '@/services/base/ServiceFactory';
