/**
 * Centralized category configuration for CampusZon
 * 
 * IMPORTANT: This is the SINGLE SOURCE OF TRUTH for all item categories.
 * Do NOT hardcode categories anywhere else in the application.
 * 
 * Used in:
 * - AddItem page (category dropdown)
 * - Profile page / Edit Item (category dropdown)
 * - Home page (filter buttons)
 */

export const ITEM_CATEGORIES = [
  "Books",
  "Electronics",
  "Clothing",
  "Furniture",
  "Sports",
  "Stationery",
  "Services",
  "Other"
] as const;

/**
 * Type-safe category type derived from the constant
 */
export type ItemCategory = typeof ITEM_CATEGORIES[number];

/**
 * Categories with "All" option for filtering
 */
export const FILTER_CATEGORIES = ["All", ...ITEM_CATEGORIES] as const;
