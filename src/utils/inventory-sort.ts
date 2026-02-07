import { InventoryItem } from "../components/inventory/UnitCard";

export const sortInventoryItems = (items: InventoryItem[]) => {
    return items.sort((a, b) => {
        // First, sort by Floor index
        const floorOrder = [
            "Lower Ground",
            "Ground Floor",
            "First Floor",
            "Second Floor",
            "Third Floor",
            "Fourth Floor",
            "Fifth Floor"
        ];

        const floorA = floorOrder.indexOf(a.floor);
        const floorB = floorOrder.indexOf(b.floor);

        if (floorA !== floorB) {
            // If explicit floor found, sort by index
            if (floorA !== -1 && floorB !== -1) return floorA - floorB;
            // If one is missing, push to end
            if (floorA === -1) return 1;
            if (floorB === -1) return -1;
        }

        // Second, sort by Unit Number (alphanumeric)
        // Extract numeric part for better sorting?
        // e.g. F101 vs F102
        return a.unit_number.localeCompare(b.unit_number, undefined, { numeric: true, sensitivity: 'base' });
    });
};
