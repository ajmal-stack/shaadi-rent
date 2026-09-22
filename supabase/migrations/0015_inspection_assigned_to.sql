-- =============================================================================
-- Migration 0015: Add assigned_to column to inspection_reports table
-- =============================================================================

-- Add assigned_to column to inspection_reports table if not exists
ALTER TABLE public.inspection_reports
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Create index for performance on inspector assignment lookups
CREATE INDEX IF NOT EXISTS idx_inspection_reports_assigned_to
ON public.inspection_reports(assigned_to);

-- Add schema comment
COMMENT ON COLUMN public.inspection_reports.assigned_to IS 'Staff member or admin user assigned to conduct or review this garment inspection.';
