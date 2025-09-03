-- Create functions to safely increment/decrement hearts
CREATE OR REPLACE FUNCTION increment_hearts(asset_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE assets 
  SET hearts = hearts + 1 
  WHERE id = asset_id
  RETURNING hearts INTO new_count;
  
  RETURN COALESCE(new_count, 0);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_hearts(asset_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE assets 
  SET hearts = GREATEST(hearts - 1, 0)
  WHERE id = asset_id
  RETURNING hearts INTO new_count;
  
  RETURN COALESCE(new_count, 0);
END;
$$ LANGUAGE plpgsql;
