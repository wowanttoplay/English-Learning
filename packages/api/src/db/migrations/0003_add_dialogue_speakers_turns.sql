-- Add dialogue fields to passages table
ALTER TABLE passages ADD COLUMN speakers TEXT;
ALTER TABLE passages ADD COLUMN turns TEXT;
