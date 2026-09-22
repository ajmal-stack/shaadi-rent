-- =============================================================================
-- Migration 0014: Notification Preferences
-- =============================================================================

-- Add notification_prefs JSONB column to profiles table if not exists
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS notification_prefs JSONB DEFAULT '{
  "email_bookings": true,
  "sms_alerts": true,
  "whatsapp_updates": true,
  "promotions": false
}'::jsonb;

-- Comment for schema documentation
COMMENT ON COLUMN public.profiles.notification_prefs IS 'User notification preference toggles (email, sms, whatsapp, promotions)';
