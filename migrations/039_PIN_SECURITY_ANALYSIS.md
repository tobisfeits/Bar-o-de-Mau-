# Critical Security Finding: PIN Authentication

## Discovery

The system uses **PIN authentication**, not passwords. This is a significant security finding that changes our audit recommendations.

## Current Implementation

### Authentication Flow
1. User selects name from dropdown
2. User enters PIN (simple numeric code)
3. App queries `app_users` table directly
4. App validates PIN client-side
5. User data stored in localStorage

### Database Schema (`app_users`)
```
- id (UUID)
- name (TEXT)
- pin (TEXT) - PLAINTEXT STORAGE ⚠️
- role (TEXT)
- unidade_id (UUID)  
- must_change_password (BOOLEAN)
```

## Security Implications

### 🚨 CRITICAL ISSUES

> [!CAUTION]
> **PINs Stored in Plaintext**
> - PINs are stored unencrypted in database
> - Anyone with database access can see all PINs
> - If Supabase anon key is compromised, all PINs are exposed

> [!CAUTION]
> **Client-Side Validation Only**
> - No server-side PIN verification
> - PIN validation happens in browser JavaScript
> - Possible to bypass with browser dev tools

> [!WARNING]
> **RLS Disabled**
> - Row Level Security is OFF on `app_users` table
> - Rationale: App doesn't use Supabase Auth (`auth.uid()` is always NULL)
> - Decision documented in migration `022_disable_rls_app_users.sql`

### Why RLS is Disabled

From migration 022 documentation:
- App uses custom login, not Supabase Auth
- `auth.uid()` always returns NULL
- RLS policies using `auth.uid()` fail
- UPDATE statements don't work with RLS enabled

## Security Assessment

### Risk Level: MEDIUM

**Mitigating Factors:**
- PINs are simple (not sensitive data like bank accounts)
- No personal data stored (no email, phone, SSN, etc.)
- HTTPS encryption in transit (Vercel)
- Application-level RBAC filtering
- Database not directly accessible from internet

**Vulnerable To:**
- Compromised Supabase anon key → all PINs readable
- Man-in-the-middle attacks (if HTTPS fails)
- Browser exploit → user impersonation
- Local storage theft → session hijacking

## Recommendations

### Priority 1: Hash PINs

**Effort**: Low  
**Impact**: HIGH

```javascript
// Use bcrypt to hash PINs before storing
import bcrypt from 'bcryptjs';

async function hashPin(pin) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(pin, salt);
}

async function verifyPin(pin, hashedPin) {
    return await bcrypt.compare(pin, hashedPin);
}
```

**Database Migration:**
```sql
-- Add hashed_pin column
ALTER TABLE app_users ADD COLUMN hashed_pin TEXT;

-- Migrate existing PINs (need to be re-entered)
-- Set must_change_password = true for all users
UPDATE app_users SET must_change_password = true;
```

### Priority 2: Server-Side Validation

**Effort**: Medium  
**Impact**: MEDIUM

Create a Supabase Edge Function for login:

```javascript
// /functions/login/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { name, pin } = await req.json()
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! // Service role for admin access
  )
  
  const { data: user } = await supabase
    .from('app_users')
    .select('id, name, hashed_pin, role')
    .eq('name', name)
    .single()
  
  if (!user) {
    return new Response(JSON.stringify({ error: 'User not found' }), { status: 401 })
  }
  
  const valid = await bcrypt.compare(pin, user.hashed_pin)
  
  if (!valid) {
    return new Response(JSON.stringify({ error: 'Invalid PIN' }), { status: 401 })
  }
  
  // Return user data (without hashed_pin)
  return new Response(JSON.stringify({ 
    id: user.id, 
    name: user.name, 
    role: user.role 
  }))
})
```

### Priority 3: Implement Session Timeout

See implementation_plan.md section 2.

### Priority 4: Add Rate Limiting

See implementation_plan.md section 5.

## Alternative: Migrate to Supabase Auth

**Effort**: HIGH  
**Impact**: HIGH  
**Risk**: MEDIUM (migration complexity)

### Benefits:
- Industry-standard security
- Built-in password reset
- Email verification
- MFA support
- Server-side validation
- RLS policies work correctly

### Implementation Steps:
1. Create Supabase Auth users for each app_user
2. Update login flow to use `supabase.auth.signInWithPassword()`
3. Store `auth.uid()` in `app_users.id`
4. Re-enable RLS with proper policies
5. Update all queries to use authenticated context

### Drawbacks:
- Complex migration
- Risk of breaking existing users
- Requires email for each user
- More code to maintain

## Conclusion

Current PIN system is **acceptable for low-risk internal use** but should be improved with:

1. ✅ **Hash PINs** (critical, easy fix)
2. ✅ **Server-side validation** (important, medium effort)
3. ⏳ **Consider Supabase Auth migration** (future improvement)

Given this is a Pathfinder youth group app (not a bank), current risk is manageable with recommended improvements.
