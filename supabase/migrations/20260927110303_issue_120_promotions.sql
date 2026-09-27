-- 1. Add is_featured to public.product
ALTER TABLE public.product
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;

-- 2. Create promotion table
CREATE TABLE IF NOT EXISTS public.promotion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    product_id UUID REFERENCES public.product(product_id) ON DELETE SET NULL,
    category_id UUID REFERENCES public.categories(category_id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_promotion_updated_at
BEFORE UPDATE ON public.promotion
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. RLS on promotion
ALTER TABLE public.promotion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active promotions within date window"
ON public.promotion FOR SELECT
USING (
    is_active = true 
    AND starts_at <= now() 
    AND ends_at >= now()
);

CREATE POLICY "Managers can manage all promotions"
ON public.promotion FOR ALL
USING (
    public.current_employee_role() = 'MANAGER'
)
WITH CHECK (
    public.current_employee_role() = 'MANAGER'
);

-- 4. Create promotion-images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('promotion-images', 'promotion-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS for storage.objects on promotion-images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'promotion-images' );

CREATE POLICY "Managers can upload promotion images"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'promotion-images' 
    AND public.current_employee_role() = 'MANAGER'
);

CREATE POLICY "Managers can update promotion images"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'promotion-images' 
    AND public.current_employee_role() = 'MANAGER'
);

CREATE POLICY "Managers can delete promotion images"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'promotion-images' 
    AND public.current_employee_role() = 'MANAGER'
);

-- 5. Notify pgrst
NOTIFY pgrst, 'reload schema';
