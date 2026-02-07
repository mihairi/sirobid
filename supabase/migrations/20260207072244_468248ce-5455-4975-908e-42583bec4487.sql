-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

-- Create auction_items table
CREATE TABLE public.auction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  starting_price DECIMAL(12, 2) NOT NULL,
  current_highest_bid DECIMAL(12, 2),
  image_url TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  original_end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bids table
CREATE TABLE public.bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_item_id UUID REFERENCES public.auction_items(id) ON DELETE CASCADE NOT NULL,
  bidder_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- User roles policies
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Auction items policies
CREATE POLICY "Anyone authenticated can view active auctions"
  ON public.auction_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert auction items"
  ON public.auction_items FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update auction items"
  ON public.auction_items FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete auction items"
  ON public.auction_items FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Bids policies
CREATE POLICY "Users can view own bids"
  ON public.bids FOR SELECT
  TO authenticated
  USING (auth.uid() = bidder_id);

CREATE POLICY "Admins can view all bids"
  ON public.bids FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can place bids"
  ON public.bids FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = bidder_id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to extend auction time if bid in last 2 minutes
CREATE OR REPLACE FUNCTION public.handle_bid_extension()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  auction_end TIMESTAMP WITH TIME ZONE;
  time_remaining INTERVAL;
BEGIN
  SELECT end_time INTO auction_end
  FROM public.auction_items
  WHERE id = NEW.auction_item_id;
  
  time_remaining := auction_end - NOW();
  
  -- If bid placed within last 2 minutes, extend by 2 minutes
  IF time_remaining <= INTERVAL '2 minutes' AND time_remaining > INTERVAL '0 seconds' THEN
    UPDATE public.auction_items
    SET end_time = end_time + INTERVAL '2 minutes',
        updated_at = NOW()
    WHERE id = NEW.auction_item_id;
  END IF;
  
  -- Update highest bid
  UPDATE public.auction_items
  SET current_highest_bid = NEW.amount,
      updated_at = NOW()
  WHERE id = NEW.auction_item_id;
  
  RETURN NEW;
END;
$$;

-- Trigger for bid extension
CREATE TRIGGER on_new_bid
  AFTER INSERT ON public.bids
  FOR EACH ROW EXECUTE FUNCTION public.handle_bid_extension();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Timestamp triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_auction_items_updated_at
  BEFORE UPDATE ON public.auction_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for auction_items and bids
ALTER PUBLICATION supabase_realtime ADD TABLE public.auction_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bids;

-- Create storage bucket for auction images
INSERT INTO storage.buckets (id, name, public) VALUES ('auction-images', 'auction-images', true);

-- Storage policies
CREATE POLICY "Anyone can view auction images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'auction-images');

CREATE POLICY "Admins can upload auction images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'auction-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update auction images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'auction-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete auction images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'auction-images' AND public.has_role(auth.uid(), 'admin'));