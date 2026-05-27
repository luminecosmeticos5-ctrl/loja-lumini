CREATE OR REPLACE FUNCTION check_columns_exist(t_name text, c_names text[])
RETURNS text[] AS $$
DECLARE
    existing_cols text[];
BEGIN
    SELECT array_agg(column_name::text) INTO existing_cols
    FROM information_schema.columns
    WHERE table_name = t_name
    AND column_name = ANY(c_names);
    RETURN existing_cols;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
