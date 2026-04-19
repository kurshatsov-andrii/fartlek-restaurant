-- Enable pgcrypto for gen_random_bytes and digest
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Recreate PIN functions using fully-qualified extension functions
CREATE OR REPLACE FUNCTION public.set_my_pin(_pin text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  _salt TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _pin !~ '^[0-9]{4,8}$' THEN
    RAISE EXCEPTION 'PIN must be 4-8 digits';
  END IF;

  _salt := encode(extensions.gen_random_bytes(16), 'hex');
  UPDATE public.profiles
  SET pin_salt = _salt,
      pin_hash = encode(extensions.digest(_salt || _pin, 'sha256'), 'hex'),
      updated_at = now()
  WHERE id = auth.uid();
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_set_user_pin(_user_id uuid, _pin text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
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

  _salt := encode(extensions.gen_random_bytes(16), 'hex');
  UPDATE public.profiles
  SET pin_salt = _salt,
      pin_hash = encode(extensions.digest(_salt || _pin, 'sha256'), 'hex'),
      updated_at = now()
  WHERE id = _user_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.verify_pin(_email text, _pin text)
 RETURNS TABLE(user_id uuid, matched boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
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

  IF _profile.pin_hash = encode(extensions.digest(_profile.pin_salt || _pin, 'sha256'), 'hex') THEN
    RETURN QUERY SELECT _profile.id, TRUE;
  ELSE
    RETURN QUERY SELECT NULL::UUID, FALSE;
  END IF;
END;
$function$;