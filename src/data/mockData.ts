import type { Therapist, Room, Service, AppState, DailyStats } from '@/types';

// Mock therapists data (47 therapists from system) - using proper UUIDs
export const mockTherapists: Therapist[] = [
  { id: '550e8400-e29b-41d4-a716-446655440001', name: 'Ally', status: 'inactive', totalEarnings: 0, totalSessions: 0, expenses: [] },
  { id: '550e8400-e29b-41d4-a716-446655440002', name: 'Anna', status: 'inactive', totalEarnings: 0, totalSessions: 0, expenses: [] },
  { id: '550e8400-e29b-41d4-a716-446655440003', name: 'Audy', status: 'inactive', totalEarnings: 0, totalSessions: 0, expenses: [] },
  { id: '550e8400-e29b-41d4-a716-446655440004', name: 'Ava', status: 'inactive', totalEarnings: 0, totalSessions: 0, expenses: [] },
  { id: '550e8400-e29b-41d4-a716-446655440005', name: 'BB', status: 'inactive', totalEarnings: 0, totalSessions: 0, expenses: [] },
  { id: '5c815af2-28d6-4882-90e1-cb4d8c07fd06', name: 'Beer-male', status: 'inactive', totalEarnings: 0, totalSessions: 0, expenses: [] },
  { id: 'efb942ee-6fa6-49e2-9cca-c9b89b330bd7', name: 'Bella', status: 'inactive', totalEarnings: 0, totalSessions: 0, expenses: [] },
  { id: 'ba1cc2fd-14f7-4376-a6fd-337be01343cf', name: 'Bowie', status: 'inactive', totalEarnings: 0, totalSessions: 0, expenses: [] },
  { id: 'fd1e2939-a1cd-4672-a6a3-89dbc8ab2fd6', name: 'Candy', status: 'inactive', totalEarnings: 0, totalSessions: 0, expenses: [] },
  { id: '9d223633-8ac1-482a-8c37-96dc65981f4c', name: 'Cherry', status: 'inactive', totalEarnings: 0, totalSessions: 0, expenses: [] },
  { id: '72a613a7-2acc-469d-b48f-31b245f77a5c', name: 'Cookie', status: 'inactive', totalEarnings: 0, totalSessions: 0, expenses: [] },
  { id: '74cddf85-c383-459a-9c18-6e805b2f1416', name: 'Diamond', status: 'inactive', totalEarnings: 0, totalSessions: 0, expenses: [] },
  { id: '91348850-1df7-4a74-a76b-06f3de8bc851', name: 'Emmy', status: 'inactive', totalEarnings: 0, totalSessions: 0, expenses: [] },
  { id: '256f9c50-ada9-42c0-b1ac-c12382c54f57', name: 'Essay', status: 'inactive', totalEarnings: 0, totalSessions: 0, expenses: [] },
  { id: 'd7c05faa-5027-4a14-aa37-9cf7c0452ab7', name: 'Gina', status: 'inactive', totalEarnings: 0, totalSessions: 0, expenses: [] },
  { id: 'acc1e36d-da29-4b1c-9b0b-e134196b2ee9', name: 'Hana', status: 'inactive', totalEarnings: 0, totalSessions: 0, expenses: [] },
  { id: '46e71eca-fb55-4136-baa6-4ff1acbe5e94', name: 'IV', status: 'inactive', totalEarnings: 0, totalSessions: 0, expenses: [] },
  { id: '265ac425-47e3-4d40-97f4-5a62b708cb88', name: 'Irin', status: 'inactive', totalEarnings: 0, totalSessions: 0, expenses: [] },
  { id: '3d30994a-4680-4b54-83fb-4c5ca719c98f', name: 'Jenny', status: 'inactive', totalEarnings: 0, totalSessions: 0, expenses: [] },
  { id: '0a49f33b-102f-4bd6-b584-d7685db5098c', name: 'Kana', status: 'inactive', totalEarnings: 0, totalSessions: 0, expenses: [] },
  { id: '00953667-fa76-4ac7-bf8e-b2cc2b4a025e', name: 'Kira', status: 'inactive', totalEarnings: 0, totalSessions: 0, expenses: [] },
  { id: 'fa439365-f422-4bf5-a52f-e6c89d96ae9f', name: 'Kitty', status: 'inactive', totalEarnings: 0, totalSessions: 0, expenses: [] },
  { id: '481eca84-a6fc-42da-b98f-c48b58143f41', name: 'Lita', status: 'inactive', totalEarnings: 0, totalSessions: 0, expenses: [] },
  { id: '7b831d38-41cf-470d-bc06-be61888c4f55', name: 'Lucky', status: 'inactive', totalEarnings: 0, totalSessions: 0, expenses: [] },
  { id: 'f7d46914-de47-4437-bb8b-6fd796915f81', name: 'Luna', status: 'inactive', totalEarnings: 0, totalSessions: 0, expenses: [] },
  { id: '41d1ebe1-bec8-4715-9390-d9c7fb673331', name: 'Mabel', status: 'inactive', totalEarnings: 0, totalSessions: 0, expenses: [] },
  { id: '11b9d9f4-4ff7-4fb7-b7c3-162646776b18', name: 'Mako', status: 'inactive', totalEarnings: 0, totalSessions: 0, expenses: [] },
  { id: '530d8e99-1879-4032-9802-7a86c6488457', name: 'Maria', status: 'inactive', totalEarnings: 0, totalSessions: 0, expenses: [] },
  { id: 'd6e459b8-6d69-4f5b-851c-2ac4a930df41', name: 'Micky', status: 'inactive', totalEarnings: 0, totalSessions: 0, expenses: [] },
  { id: '6aa9c159-9b7b-4256-af23-8d3034487411', name: 'Miku', status: 'inactive', totalEarnings: 0, totalSessions: 0, expenses: [] },
  { id: '6660ff02-ba3d-4023-98f6-7b1a7faf8ada', name: 'Mimi', status: 'inactive', totalEarnings: 0, totalSessions: 0, expenses: [] },
  { id: '4cfb600d-3e1b-4fde-b93b-6f7febdd9418', name: 'Mina', status: 'inactive', totalEarnings: 0, totalSessions: 0, expenses: [] },
  { id: '05b08c66-de72-41ed-9374-9e6594a07074', name: 'Nabee', status: 'inactive', totalEarnings: 0, totalSessions: 0, expenses: [] },
  { id: '30fc0ad5-1efe-4426-a87e-a950f775db8d', name: 'Nana', status: 'inactive', totalEarnings: 0, totalSessions: 0, expenses: [] },
  { id: '897d600d-3132-4238-a4f5-ab0ec350045e', name: 'Nicha', status: 'inactive', totalEarnings: 0, totalSessions: 0, expenses: [] },
  { id: '80c7c454-0273-453d-bb7f-2358533720bb', name: 'Oily', status: 'inactive', totalEarnings: 0, totalSessions: 0, expenses: [] },
  { id: '10c83254-c9e8-4965-9160-d4174eff39a3', name: 'Palmy', status: 'inactive', totalEarnings: 0, totalSessions: 0, expenses: [] },
  { id: '3b0e4bb2-fb37-4e15-9dd3-1eda1075ef5e', name: 'Rosy', status: 'inactive', totalEarnings: 0, totalSessions: 0, expenses: [] },
  { id: 'b4fcd466-f5db-43b1-b208-1add07430d6f', name: 'Sara', status: 'inactive', totalEarnings: 0, totalSessions: 0, expenses: [] },
  { id: '4696e832-b0dc-49ce-98a3-b7e320b3f687', name: 'Shopee', status: 'inactive', totalEarnings: 0, totalSessions: 0, expenses: [] },
  { id: '4bdc401b-b8ce-478b-8d4c-42a552634bfb', name: 'Sophia', status: 'inactive', totalEarnings: 0, totalSessions: 0, expenses: [] },
  { id: '8436d2f2-4e23-4091-98e2-cf74689d43cb', name: 'Sunny', status: 'inactive', totalEarnings: 0, totalSessions: 0, expenses: [] },
  { id: '2084e6f5-fcc4-4ce7-8f66-eadf07549575', name: 'Susie', status: 'inactive', totalEarnings: 0, totalSessions: 0, expenses: [] },
  { id: 'e2b34e8c-5a69-4111-94b3-2f677e2cb8f3', name: 'Tata', status: 'inactive', totalEarnings: 0, totalSessions: 0, expenses: [] },
  { id: 'd4e278a7-0e95-4e94-8684-7236cf85ce1c', name: 'Violet', status: 'inactive', totalEarnings: 0, totalSessions: 0, expenses: [] },
  { id: 'b92666f5-4ee6-488a-b551-235a604fd370', name: 'Yuki', status: 'inactive', totalEarnings: 0, totalSessions: 0, expenses: [] },
  { id: '5b0c6052-6d64-44b9-9808-59ade43fa2cd', name: 'Yuri', status: 'inactive', totalEarnings: 0, totalSessions: 0, expenses: [] }
];

// Mock rooms data (9 rooms)
export const mockRooms: Room[] = [
  // Standard Shower Rooms
  { id: '07e7d901-b141-4a0a-a3bb-213d8df981cf', name: 'Room 1', type: 'Shower', status: 'available' },
  { id: '8071741b-2372-4b7e-97c6-85dba175b853', name: 'Room 2', type: 'Shower', status: 'available' },
  { id: '4a3a5702-cc12-450c-b88d-dbd8c67eb574', name: 'Room 3', type: 'Shower', status: 'available' },
  
  // VIP Jacuzzi Rooms
  { id: '470aa3ef-0267-445f-9e92-bd6713dfc00a', name: 'Room 4', type: 'VIP Jacuzzi', status: 'available' },
  { id: '460f1f84-9e0c-48a6-917a-c6ece1db7f03', name: 'Room 5', type: 'VIP Jacuzzi', status: 'available' },
  { id: '638316f5-bf77-4927-aab0-20e7ba5e4c7b', name: 'Room 6', type: 'VIP Jacuzzi', status: 'available' },
  { id: '4d6d52a4-9106-48c8-b4af-0a44ee11b9a8', name: 'Room 9', type: 'VIP Jacuzzi', status: 'available' },
  
  // Large Shower Rooms
  { id: '296e1573-b05e-42d6-906e-c0670b7d0698', name: 'Room 7', type: 'Double Bed Shower (large)', status: 'available' },
  { id: 'eb7ff154-9ec8-4d02-8f77-98b6d883667e', name: 'Room 8', type: 'Single Bed Shower (large)', status: 'available' },
];

// Mock services data
export const mockServices: Service[] = [
  // Single Girl Packages - Shower
  { id: 'caff4474-7d8b-4837-ab84-11b1bf46f40c', category: 'Single', roomType: 'Shower', duration: 40, price: 3200, ladyPayout: 1300, shopRevenue: 1900, description: '40 min Single Shower' },
  { id: 'faa369b3-d6bb-40e1-82c0-1f37c9f48b19', category: 'Single', roomType: 'Shower', duration: 60, price: 3500, ladyPayout: 1500, shopRevenue: 2000, description: '60 min Single Shower' },
  { id: '356afb7f-64d8-493c-850c-c7473ffd0050', category: 'Single', roomType: 'Shower', duration: 90, price: 4000, ladyPayout: 1800, shopRevenue: 2200, description: '90 min Single Shower' },
  
  // Single Girl Packages - VIP Jacuzzi
  { id: 'c0c87cab-4f18-40ef-ab22-08acd11e6dca', category: 'Single', roomType: 'VIP Jacuzzi', duration: 60, price: 4000, ladyPayout: 2000, shopRevenue: 2000, description: '60 min Single VIP Jacuzzi' },
  { id: 'e1d6ee0f-8a35-4c49-bfb9-7596e3c5d95a', category: 'Single', roomType: 'VIP Jacuzzi', duration: 90, price: 5000, ladyPayout: 2300, shopRevenue: 2700, description: '90 min Single VIP Jacuzzi' },
  
  // Double Girl Packages - Shower
  { id: '5181f1a6-e70a-472f-9472-cda92460944c', category: 'Double', roomType: 'Shower', duration: 60, price: 6500, ladyPayout: 3400, shopRevenue: 3100, description: '60 min Double Shower (2 Ladies)' },
  { id: '4c3d03a1-ec3d-429d-8cd4-5aa4b9fe1bf4', category: 'Double', roomType: 'Shower', duration: 90, price: 7500, ladyPayout: 4000, shopRevenue: 3500, description: '90 min Double Shower (2 Ladies)' },
  
  // Double Girl Packages - VIP Jacuzzi
  { id: '3329183d-6293-408f-8eff-6b6f24bda7a1', category: 'Double', roomType: 'VIP Jacuzzi', duration: 60, price: 7500, ladyPayout: 4000, shopRevenue: 3500, description: '60 min Double VIP Jacuzzi (2 Ladies)' },
  { id: '1c72a38b-b9ae-46cf-a078-30117eab1329', category: 'Double', roomType: 'VIP Jacuzzi', duration: 90, price: 8500, ladyPayout: 4800, shopRevenue: 3700, description: '90 min Double VIP Jacuzzi (2 Ladies)' },
  
  // Couple Packages - Shower
  { id: '7820401e-29ad-4863-9dab-7bb59bae2228', category: 'Couple', roomType: 'Shower', duration: 60, price: 7500, ladyPayout: 2500, shopRevenue: 5000, description: '60 min Couple Shower' },
  { id: '85ff4a23-2717-4702-a14a-1f58621246f6', category: 'Couple', roomType: 'Shower', duration: 90, price: 8000, ladyPayout: 3000, shopRevenue: 5000, description: '90 min Couple Shower' },
  
  // Couple Packages - VIP Jacuzzi
  { id: 'b33b7f35-f3a0-4de5-8d15-f11711649147', category: 'Couple', roomType: 'VIP Jacuzzi', duration: 60, price: 8500, ladyPayout: 3000, shopRevenue: 5500, description: '60 min Couple VIP Jacuzzi' },
  { id: '6f947fe1-91f3-4bff-93d8-096aef65e2dc', category: 'Couple', roomType: 'VIP Jacuzzi', duration: 90, price: 9000, ladyPayout: 3500, shopRevenue: 5500, description: '90 min Couple VIP Jacuzzi' },
];

// Initial daily stats
export const initialDailyStats: DailyStats = {
  totalSlips: 0,
  totalRevenue: 0,
  totalPayouts: 0,
  totalDiscounts: 0,
  shopRevenue: 0,
  walkOutCount: 0,
  completedSessions: 0,
};

// Initial app state
export const initialAppState: AppState = {
  currentPhase: 'daily-operations',
  therapists: mockTherapists,
  todayRoster: [],
  rooms: mockRooms,
  services: mockServices,
  sessions: [],
  walkOuts: [],
  dailyStats: initialDailyStats,
  history: [],
  undoStack: [],
};