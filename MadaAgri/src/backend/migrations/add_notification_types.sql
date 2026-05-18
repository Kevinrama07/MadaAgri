-- Add new notification types
ALTER TABLE notifications 
MODIFY COLUMN type ENUM('message', 'collaboration', 'follow', 'like', 'comment', 'mention', 'purchase', 'order', 'order_confirmed', 'order_cancelled', 'profile_view', 'system') NOT NULL;
