-- Add polygon_coordinates column to land_parcels table
-- This column stores the GeoJSON polygon data for each parcel

ALTER TABLE land_parcels 
ADD COLUMN polygon_coordinates JSON DEFAULT NULL AFTER longitude;

-- Create an index on polygon_coordinates for better query performance
-- Note: JSON columns don't support traditional indexes, but we can use generated columns if needed later
