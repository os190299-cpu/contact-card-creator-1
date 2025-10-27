-- Add telegram_link column to contacts table
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS telegram_link VARCHAR(500);

-- Add display_order column to contacts table  
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;