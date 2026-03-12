
import { Category, EmissionFactor } from './types';

// EPA Emission Factors (2023/2024 averages)
export const EMISSION_FACTORS: Record<Category, Record<string, EmissionFactor>> = {
  [Category.ELECTRICITY]: {
    'us-avg': { label: 'US Grid Average', value: 0.371, unit: 'kWh' }, // kg CO2e per kWh
    'renewable': { label: '100% Renewable', value: 0.02, unit: 'kWh' },
    'coal-heavy': { label: 'Coal Heavy Grid', value: 0.85, unit: 'kWh' },
  },
  [Category.TRANSPORTATION]: {
    'car-gas': { label: 'Gasoline Car (Avg)', value: 0.341, unit: 'mile' }, // kg CO2e per mile
    'car-ev': { label: 'Electric Vehicle (Avg)', value: 0.110, unit: 'mile' },
    'flight-short': { label: 'Short Flight', value: 0.25, unit: 'mile' },
    'bus': { label: 'Public Bus', value: 0.05, unit: 'mile' },
    'train': { label: 'Intercity Train', value: 0.04, unit: 'mile' },
  },
  [Category.FOOD]: {
    'beef': { label: 'Beef', value: 27.0, unit: 'kg' }, // kg CO2e per kg
    'poultry': { label: 'Poultry', value: 6.9, unit: 'kg' },
    'dairy': { label: 'Dairy Products', value: 1.9, unit: 'kg' },
    'vegetables': { label: 'Vegetables/Fruit', value: 0.4, unit: 'kg' },
    'plant-based': { label: 'Plant-based Meat', value: 2.5, unit: 'kg' },
  }
};

export const COLORS = {
  [Category.ELECTRICITY]: '#fbbf24', // Amber
  [Category.TRANSPORTATION]: '#3b82f6', // Blue
  [Category.FOOD]: '#10b981', // Emerald
};
