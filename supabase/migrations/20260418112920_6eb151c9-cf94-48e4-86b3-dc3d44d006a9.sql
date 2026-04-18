-- App role enum
CREATE TYPE public.app_role AS ENUM ('super_admin', 'owner', 'manager', 'waiter', 'kitchen', 'cashier');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  pin_hash TEXT,
  pin_salt TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Public view excludes pin_hash/pin_salt
CREATE VIEW public.profiles_public WITH (security_invoker=on) AS
  SELECT id, email, full_name, created_at, updated_at FROM public.profiles;

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer role check
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Get all roles for a user
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID)
RETURNS SETOF public.app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id
$$;

-- Profiles RLS: users can view/update their own; managers/owners can view all
CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Managers view all profiles" ON public.profiles
  FOR SELECT USING (
    public.has_role(auth.uid(), 'manager') OR
    public.has_role(auth.uid(), 'owner') OR
    public.has_role(auth.uid(), 'super_admin')
  );
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- user_roles RLS
CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all roles" ON public.user_roles
  FOR SELECT USING (
    public.has_role(auth.uid(), 'manager') OR
    public.has_role(auth.uid(), 'owner') OR
    public.has_role(auth.uid(), 'super_admin')
  );
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL USING (
    public.has_role(auth.uid(), 'owner') OR
    public.has_role(auth.uid(), 'super_admin')
  ) WITH CHECK (
    public.has_role(auth.uid(), 'owner') OR
    public.has_role(auth.uid(), 'super_admin')
  );

-- Updated-at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile + default 'waiter' role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role public.app_role;
  _role_text TEXT;
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );

  _role_text := COALESCE(NEW.raw_user_meta_data->>'role', 'waiter');
  BEGIN
    _role := _role_text::public.app_role;
  EXCEPTION WHEN OTHERS THEN
    _role := 'waiter'::public.app_role;
  END;

  -- Never allow self-assigning super_admin/owner via signup metadata
  IF _role IN ('super_admin', 'owner') THEN
    _role := 'waiter';
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- PIN verification RPC: returns the user_id whose pin matches (scoped by email optional)
-- For security, PIN alone is too weak; require email + PIN combination
CREATE OR REPLACE FUNCTION public.verify_pin(_email TEXT, _pin TEXT)
RETURNS TABLE (user_id UUID, matched BOOLEAN)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _profile RECORD;
BEGIN
  SELECT p.id, p.pin_hash, p.pin_salt INTO _profile
  FROM public.profiles p
  WHERE lower(p.email) = lower(_email)
  LIMIT 1;

  IF _profile.id IS NULL OR _profile.pin_hash IS NULL THEN
    RETURN QUERY SELECT NULL::UUID, FALSE;
    RETURN;
  END IF;

  IF _profile.pin_hash = encode(digest(_profile.pin_salt || _pin, 'sha256'), 'hex') THEN
    RETURN QUERY SELECT _profile.id, TRUE;
  ELSE
    RETURN QUERY SELECT NULL::UUID, FALSE;
  END IF;
END;
$$;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Set PIN for current user
CREATE OR REPLACE FUNCTION public.set_my_pin(_pin TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _salt TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _pin !~ '^[0-9]{4,8}$' THEN
    RAISE EXCEPTION 'PIN must be 4-8 digits';
  END IF;

  _salt := encode(gen_random_bytes(16), 'hex');
  UPDATE public.profiles
  SET pin_salt = _salt,
      pin_hash = encode(digest(_salt || _pin, 'sha256'), 'hex')
  WHERE id = auth.uid();
END;
$$;