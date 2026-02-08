-- Drop existing restrictive policies and recreate as permissive

-- AUCTION_ITEMS policies
DROP POLICY IF EXISTS "Anyone authenticated can view active auctions" ON public.auction_items;
DROP POLICY IF EXISTS "Admins can insert auction items" ON public.auction_items;
DROP POLICY IF EXISTS "Admins can update auction items" ON public.auction_items;
DROP POLICY IF EXISTS "Admins can delete auction items" ON public.auction_items;

-- Recreate as PERMISSIVE policies (default)
CREATE POLICY "Anyone can view auctions" 
ON public.auction_items 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can insert auctions" 
ON public.auction_items 
FOR INSERT 
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update auctions" 
ON public.auction_items 
FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete auctions" 
ON public.auction_items 
FOR DELETE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- BIDS policies - fix restrictive policies
DROP POLICY IF EXISTS "Admins can view all bids" ON public.bids;
DROP POLICY IF EXISTS "Users can view own bids" ON public.bids;
DROP POLICY IF EXISTS "Authenticated users can place bids" ON public.bids;

-- Recreate as PERMISSIVE (OR logic)
CREATE POLICY "Users can view own bids" 
ON public.bids 
FOR SELECT 
TO authenticated
USING (auth.uid() = bidder_id);

CREATE POLICY "Admins can view all bids" 
ON public.bids 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can place bids" 
ON public.bids 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = bidder_id);

-- PROFILES policies - fix restrictive policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

-- USER_ROLES policies - fix restrictive policies  
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

CREATE POLICY "Users can view own roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles" 
ON public.user_roles 
FOR ALL 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Storage policies for auction-images bucket
DROP POLICY IF EXISTS "Anyone can view auction images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload auction images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update auction images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete auction images" ON storage.objects;

CREATE POLICY "Anyone can view auction images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'auction-images');

CREATE POLICY "Admins can upload auction images" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'auction-images' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update auction images" 
ON storage.objects 
FOR UPDATE 
TO authenticated
USING (bucket_id = 'auction-images' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete auction images" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (bucket_id = 'auction-images' AND public.has_role(auth.uid(), 'admin'::app_role));