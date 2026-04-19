
-- Allow managers/owners/super_admins to update any profile (in addition to users updating their own)
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Update own or managed profile"
ON public.profiles
FOR UPDATE
USING (
  auth.uid() = id
  OR public.has_role(auth.uid(), 'manager'::public.app_role)
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);

-- Admin: set PIN for another user
CREATE OR REPLACE FUNCTION public.admin_set_user_pin(_user_id uuid, _pin text)
RETURNS void
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
  IF NOT (
    public.has_role(auth.uid(), 'manager'::public.app_role)
    OR public.has_role(auth.uid(), 'owner'::public.app_role)
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;
  IF _pin !~ '^[0-9]{4,8}$' THEN
    RAISE EXCEPTION 'PIN must be 4-8 digits';
  END IF;

  _salt := encode(gen_random_bytes(16), 'hex');
  UPDATE public.profiles
  SET pin_salt = _salt,
      pin_hash = encode(digest(_salt || _pin, 'sha256'), 'hex'),
      updated_at = now()
  WHERE id = _user_id;
END;
$$;

-- Admin: clear PIN for another user
CREATE OR REPLACE FUNCTION public.admin_clear_user_pin(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF NOT (
    public.has_role(auth.uid(), 'manager'::public.app_role)
    OR public.has_role(auth.uid(), 'owner'::public.app_role)
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  UPDATE public.profiles
  SET pin_salt = NULL, pin_hash = NULL, updated_at = now()
  WHERE id = _user_id;
END;
$$;
