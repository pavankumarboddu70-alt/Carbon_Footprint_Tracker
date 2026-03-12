
export enum Category {
  ELECTRICITY = 'Electricity',
  TRANSPORTATION = 'Transportation',
  FOOD = 'Food',
}

export interface EmissionEntry {
  id: string;
  category: Category;
  description: string;
  amount: number; // Raw unit (kWh, miles, kg)
  co2e: number;   // Calculated kg CO2e
  date: string;
}

export interface EmissionFactor {
  label: string;
  value: number; // kg CO2e per unit
  unit: string;
}

export interface FootprintSummary {
  total: number;
  byCategory: Record<Category, number>;
  goalPercentage: number;
  isOverGoal: boolean;
}

export interface AIAdvice {
  summary: string;
  recommendations: string[];
  comparativeInsight: string;
}
