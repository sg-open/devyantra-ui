-- Modified SQL
SELECT
    user_id,
    name as user_name,
    email,
    created_date,
    last_login
FROM users
WHERE status = 'active'
    AND created_date < '2024-06-01'
ORDER BY name;

-- Updated permissions
UPDATE user_permissions
SET can_edit = false,
    can_delete = true
WHERE user_id IN (1, 2, 3, 4);

-- Insert new record with additional field
INSERT INTO audit_log (user_id, action, timestamp, ip_address)
VALUES (123, 'logout', NOW(), '192.168.1.1');