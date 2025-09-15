-- Original SQL
SELECT
    user_id,
    name6 as user_name,
    email,
    created_date
FROM users
WHERE status = 'active'
    AND created_date > '2024-01-01'
ORDER BY name6;

-- Updated permissions
UPDATE user_permissions
SET can_edit = true
WHERE user_id IN (1, 2, 3);

-- Insert new record
INSERT INTO audit_log (user_id, action, timestamp)
VALUES (123, 'login', NOW());