export type UnitCategory = 'Apartment' | 'Shop';
export type FloorType = '1st Floor' | '2nd to 6th Floor' | 'Lower Ground' | 'Ground Floor';
export type FacingType = 'General' | 'Commercial' | 'Boulevard';

interface PricingRule {
    rate: number; // per sqft
}

export const getStandardRate = (
    category: UnitCategory,
    floor: FloorType,
    facing?: FacingType
): number => {
    if (category === 'Apartment') {
        if (floor === '1st Floor') return 17000;
        if (floor === '2nd to 6th Floor') return 14000;
    }

    if (category === 'Shop') {
        if (floor === 'Lower Ground') {
            if (facing === 'General') return 33000;
            if (facing === 'Commercial') return 36000;
            if (facing === 'Boulevard') return 38000;
        }
        if (floor === 'Ground Floor') {
            if (facing === 'General') return 40000;
            if (facing === 'Commercial') return 45000;
            if (facing === 'Boulevard') return 50000;
        }
    }

    return 0; // Should not happen with valid inputs
};

export const UNIT_CATEGORIES: UnitCategory[] = ['Apartment', 'Shop'];

export const FLOOR_TYPES: Record<UnitCategory, FloorType[]> = {
    'Apartment': ['1st Floor', '2nd to 6th Floor'],
    'Shop': ['Lower Ground', 'Ground Floor']
};

export const FACING_TYPES: FacingType[] = ['General', 'Commercial', 'Boulevard'];
