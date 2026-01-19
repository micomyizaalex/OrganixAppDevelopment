import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Middleware to verify authenticated user
const requireAuth = async (c: any, next: any) => {
  const accessToken = c.req.header('Authorization')?.split(' ')[1];
  if (!accessToken) {
    return c.json({ error: 'Unauthorized - No token provided' }, 401);
  }
  
  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  if (error || !user) {
    return c.json({ error: 'Unauthorized - Invalid token' }, 401);
  }
  
  c.set('user', user);
  await next();
};

// Health check endpoint
app.get("/make-server-db599f4a/health", (c) => {
  return c.json({ status: "ok" });
});

// ==================== AUTH ROUTES ====================

// Sign up - Create new user with role
app.post("/make-server-db599f4a/auth/signup", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, name, role } = body;

    if (!email || !password || !name || !role) {
      return c.json({ error: 'Missing required fields: email, password, name, role' }, 400);
    }

    // Validate role
    const validRoles = ['patient', 'donor', 'hospital', 'sponsor', 'admin'];
    if (!validRoles.includes(role)) {
      return c.json({ error: 'Invalid role. Must be one of: patient, donor, hospital, sponsor, admin' }, 400);
    }

    // Create user with Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm since email server isn't configured
      user_metadata: { name, role }
    });

    if (error) {
      console.log('Auth signup error:', error);
      return c.json({ error: `Failed to create user: ${error.message}` }, 400);
    }

    // Store user profile in KV store
    const userId = data.user.id;
    await kv.set(`user:${userId}`, {
      id: userId,
      email,
      name,
      role,
      createdAt: new Date().toISOString(),
      approved: role === 'patient' || role === 'donor' // Hospitals and sponsors need admin approval
    });

    // Create role-specific profile
    if (role === 'patient') {
      await kv.set(`patient:${userId}`, {
        userId,
        name,
        cases: [],
        createdAt: new Date().toISOString()
      });
    } else if (role === 'donor') {
      await kv.set(`donor:${userId}`, {
        userId,
        name,
        donorType: null,
        consentGiven: false,
        canWithdraw: true,
        createdAt: new Date().toISOString()
      });
    } else if (role === 'hospital') {
      await kv.set(`hospital:${userId}`, {
        userId,
        name,
        approved: false,
        cases: [],
        createdAt: new Date().toISOString()
      });
    } else if (role === 'sponsor') {
      await kv.set(`sponsor:${userId}`, {
        userId,
        name,
        approved: false,
        fundedCases: [],
        totalFunded: 0,
        createdAt: new Date().toISOString()
      });
    }

    // Log audit event
    await kv.set(`audit:${Date.now()}:${userId}`, {
      userId,
      action: 'USER_SIGNUP',
      role,
      timestamp: new Date().toISOString()
    });

    return c.json({ 
      success: true, 
      user: { id: userId, email, name, role },
      message: role === 'hospital' || role === 'sponsor' 
        ? 'Account created. Awaiting admin approval.'
        : 'Account created successfully.'
    });

  } catch (error) {
    console.log('Signup error:', error);
    return c.json({ error: `Signup failed: ${error}` }, 500);
  }
});

// Sign in
app.post("/make-server-db599f4a/auth/signin", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;

    if (!email || !password) {
      return c.json({ error: 'Missing email or password' }, 400);
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.log('Auth signin error:', error);
      return c.json({ error: `Sign in failed: ${error.message}` }, 401);
    }

    const userId = data.user.id;
    const userProfile = await kv.get(`user:${userId}`);

    if (!userProfile) {
      return c.json({ error: 'User profile not found' }, 404);
    }

    // Check if user needs approval
    if ((userProfile.role === 'hospital' || userProfile.role === 'sponsor') && !userProfile.approved) {
      return c.json({ 
        error: 'Account pending admin approval',
        needsApproval: true 
      }, 403);
    }

    // Log audit event
    await kv.set(`audit:${Date.now()}:${userId}`, {
      userId,
      action: 'USER_SIGNIN',
      timestamp: new Date().toISOString()
    });

    return c.json({
      success: true,
      accessToken: data.session.access_token,
      user: {
        id: userId,
        email: userProfile.email,
        name: userProfile.name,
        role: userProfile.role
      }
    });

  } catch (error) {
    console.log('Signin error:', error);
    return c.json({ error: `Sign in failed: ${error}` }, 500);
  }
});

// Get current session
app.get("/make-server-db599f4a/auth/session", requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const userProfile = await kv.get(`user:${user.id}`);

    if (!userProfile) {
      return c.json({ error: 'User profile not found' }, 404);
    }

    return c.json({
      success: true,
      user: {
        id: user.id,
        email: userProfile.email,
        name: userProfile.name,
        role: userProfile.role,
        approved: userProfile.approved
      }
    });

  } catch (error) {
    console.log('Session error:', error);
    return c.json({ error: `Session check failed: ${error}` }, 500);
  }
});

// Sign out
app.post("/make-server-db599f4a/auth/signout", requireAuth, async (c) => {
  try {
    const user = c.get('user');
    
    // Log audit event
    await kv.set(`audit:${Date.now()}:${user.id}`, {
      userId: user.id,
      action: 'USER_SIGNOUT',
      timestamp: new Date().toISOString()
    });

    return c.json({ success: true, message: 'Signed out successfully' });

  } catch (error) {
    console.log('Signout error:', error);
    return c.json({ error: `Sign out failed: ${error}` }, 500);
  }
});

// ==================== PATIENT CASE ROUTES ====================

// Create patient case
app.post("/make-server-db599f4a/cases", requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const userProfile = await kv.get(`user:${user.id}`);

    if (userProfile.role !== 'patient') {
      return c.json({ error: 'Only patients can create cases' }, 403);
    }

    const body = await c.req.json();
    const { organNeeded, urgencyLevel, notes } = body;

    if (!organNeeded || !urgencyLevel) {
      return c.json({ error: 'Missing required fields: organNeeded, urgencyLevel' }, 400);
    }

    const caseId = `case:${Date.now()}:${user.id}`;
    const newCase = {
      id: caseId,
      patientId: user.id,
      patientName: userProfile.name,
      organNeeded,
      urgencyLevel,
      notes: notes || '',
      status: 'waiting',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      matchedDonorId: null,
      assignedHospitalId: null,
      fundingAmount: 0,
      fundingGoal: 0,
      sponsors: []
    };

    await kv.set(caseId, newCase);

    // Update patient profile
    const patientProfile = await kv.get(`patient:${user.id}`);
    patientProfile.cases.push(caseId);
    await kv.set(`patient:${user.id}`, patientProfile);

    // Log audit event
    await kv.set(`audit:${Date.now()}:${user.id}`, {
      userId: user.id,
      action: 'CASE_CREATED',
      caseId,
      timestamp: new Date().toISOString()
    });

    return c.json({ success: true, case: newCase });

  } catch (error) {
    console.log('Case creation error:', error);
    return c.json({ error: `Failed to create case: ${error}` }, 500);
  }
});

// Get all cases (filtered by role)
app.get("/make-server-db599f4a/cases", requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const userProfile = await kv.get(`user:${user.id}`);

    // Get all cases
    const allCases = await kv.getByPrefix('case:');
    
    // Filter based on role
    let filteredCases = allCases;
    
    if (userProfile.role === 'patient') {
      // Patients only see their own cases
      filteredCases = allCases.filter((c: any) => c.patientId === user.id);
    } else if (userProfile.role === 'donor') {
      // Donors don't see patient identity, only general stats
      filteredCases = allCases.map((c: any) => ({
        id: c.id,
        organNeeded: c.organNeeded,
        urgencyLevel: c.urgencyLevel,
        status: c.status,
        createdAt: c.createdAt
      }));
    } else if (userProfile.role === 'hospital') {
      // Hospitals see cases assigned to them or unassigned
      const hospitalProfile = await kv.get(`hospital:${user.id}`);
      if (!hospitalProfile.approved) {
        return c.json({ error: 'Hospital not approved' }, 403);
      }
      filteredCases = allCases.filter((c: any) => 
        !c.assignedHospitalId || c.assignedHospitalId === user.id
      );
    } else if (userProfile.role === 'sponsor') {
      // Sponsors see verified cases only (no donor info)
      const sponsorProfile = await kv.get(`sponsor:${user.id}`);
      if (!sponsorProfile.approved) {
        return c.json({ error: 'Sponsor not approved' }, 403);
      }
      filteredCases = allCases.map((c: any) => ({
        id: c.id,
        patientName: c.patientName,
        organNeeded: c.organNeeded,
        urgencyLevel: c.urgencyLevel,
        status: c.status,
        fundingAmount: c.fundingAmount,
        fundingGoal: c.fundingGoal,
        createdAt: c.createdAt
      }));
    } else if (userProfile.role === 'admin') {
      // Admins see everything
      filteredCases = allCases;
    }

    return c.json({ success: true, cases: filteredCases });

  } catch (error) {
    console.log('Get cases error:', error);
    return c.json({ error: `Failed to get cases: ${error}` }, 500);
  }
});

// Update case status (hospitals only)
app.put("/make-server-db599f4a/cases/:caseId", requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const userProfile = await kv.get(`user:${user.id}`);
    const caseId = c.req.param('caseId');

    if (userProfile.role !== 'hospital' && userProfile.role !== 'admin') {
      return c.json({ error: 'Only hospitals and admins can update cases' }, 403);
    }

    const existingCase = await kv.get(caseId);
    if (!existingCase) {
      return c.json({ error: 'Case not found' }, 404);
    }

    const body = await c.req.json();
    const updatedCase = {
      ...existingCase,
      ...body,
      updatedAt: new Date().toISOString()
    };

    await kv.set(caseId, updatedCase);

    // Log audit event
    await kv.set(`audit:${Date.now()}:${user.id}`, {
      userId: user.id,
      action: 'CASE_UPDATED',
      caseId,
      changes: body,
      timestamp: new Date().toISOString()
    });

    return c.json({ success: true, case: updatedCase });

  } catch (error) {
    console.log('Case update error:', error);
    return c.json({ error: `Failed to update case: ${error}` }, 500);
  }
});

// ==================== DONOR ROUTES ====================

// Update donor consent
app.post("/make-server-db599f4a/donor/consent", requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const userProfile = await kv.get(`user:${user.id}`);

    if (userProfile.role !== 'donor') {
      return c.json({ error: 'Only donors can give consent' }, 403);
    }

    const body = await c.req.json();
    const { donorType, consentGiven } = body;

    if (!donorType || consentGiven === undefined) {
      return c.json({ error: 'Missing required fields: donorType, consentGiven' }, 400);
    }

    const donorProfile = await kv.get(`donor:${user.id}`);
    donorProfile.donorType = donorType;
    donorProfile.consentGiven = consentGiven;
    donorProfile.consentDate = new Date().toISOString();

    await kv.set(`donor:${user.id}`, donorProfile);

    // Log audit event
    await kv.set(`audit:${Date.now()}:${user.id}`, {
      userId: user.id,
      action: consentGiven ? 'CONSENT_GIVEN' : 'CONSENT_WITHDRAWN',
      donorType,
      timestamp: new Date().toISOString()
    });

    return c.json({ success: true, donor: donorProfile });

  } catch (error) {
    console.log('Consent update error:', error);
    return c.json({ error: `Failed to update consent: ${error}` }, 500);
  }
});

// Get donor profile
app.get("/make-server-db599f4a/donor/profile", requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const userProfile = await kv.get(`user:${user.id}`);

    if (userProfile.role !== 'donor') {
      return c.json({ error: 'Only donors can view donor profile' }, 403);
    }

    const donorProfile = await kv.get(`donor:${user.id}`);
    return c.json({ success: true, donor: donorProfile });

  } catch (error) {
    console.log('Get donor profile error:', error);
    return c.json({ error: `Failed to get donor profile: ${error}` }, 500);
  }
});

// ==================== SPONSOR ROUTES ====================

// Fund a case
app.post("/make-server-db599f4a/sponsor/fund", requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const userProfile = await kv.get(`user:${user.id}`);

    if (userProfile.role !== 'sponsor') {
      return c.json({ error: 'Only sponsors can fund cases' }, 403);
    }

    const sponsorProfile = await kv.get(`sponsor:${user.id}`);
    if (!sponsorProfile.approved) {
      return c.json({ error: 'Sponsor not approved' }, 403);
    }

    const body = await c.req.json();
    const { caseId, amount } = body;

    if (!caseId || !amount || amount <= 0) {
      return c.json({ error: 'Invalid caseId or amount' }, 400);
    }

    const caseData = await kv.get(caseId);
    if (!caseData) {
      return c.json({ error: 'Case not found' }, 404);
    }

    // Update case funding
    caseData.fundingAmount = (caseData.fundingAmount || 0) + amount;
    caseData.sponsors = caseData.sponsors || [];
    caseData.sponsors.push({
      sponsorId: user.id,
      sponsorName: userProfile.name,
      amount,
      date: new Date().toISOString()
    });

    // Check if fully funded
    if (caseData.fundingGoal > 0 && caseData.fundingAmount >= caseData.fundingGoal) {
      caseData.status = 'funded';
    }

    await kv.set(caseId, caseData);

    // Update sponsor profile
    sponsorProfile.fundedCases.push(caseId);
    sponsorProfile.totalFunded = (sponsorProfile.totalFunded || 0) + amount;
    await kv.set(`sponsor:${user.id}`, sponsorProfile);

    // Log audit event
    await kv.set(`audit:${Date.now()}:${user.id}`, {
      userId: user.id,
      action: 'CASE_FUNDED',
      caseId,
      amount,
      timestamp: new Date().toISOString()
    });

    return c.json({ success: true, case: caseData });

  } catch (error) {
    console.log('Funding error:', error);
    return c.json({ error: `Failed to fund case: ${error}` }, 500);
  }
});

// Get sponsor stats
app.get("/make-server-db599f4a/sponsor/stats", requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const userProfile = await kv.get(`user:${user.id}`);

    if (userProfile.role !== 'sponsor') {
      return c.json({ error: 'Only sponsors can view sponsor stats' }, 403);
    }

    const sponsorProfile = await kv.get(`sponsor:${user.id}`);
    
    return c.json({ 
      success: true, 
      stats: {
        totalFunded: sponsorProfile.totalFunded || 0,
        casesSupported: sponsorProfile.fundedCases.length,
        approved: sponsorProfile.approved
      }
    });

  } catch (error) {
    console.log('Get sponsor stats error:', error);
    return c.json({ error: `Failed to get sponsor stats: ${error}` }, 500);
  }
});

// ==================== ADMIN ROUTES ====================

// Get pending approvals
app.get("/make-server-db599f4a/admin/pending", requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const userProfile = await kv.get(`user:${user.id}`);

    if (userProfile.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const allUsers = await kv.getByPrefix('user:');
    const pendingUsers = allUsers.filter((u: any) => 
      (u.role === 'hospital' || u.role === 'sponsor') && !u.approved
    );

    return c.json({ success: true, pendingUsers });

  } catch (error) {
    console.log('Get pending approvals error:', error);
    return c.json({ error: `Failed to get pending approvals: ${error}` }, 500);
  }
});

// Approve user
app.post("/make-server-db599f4a/admin/approve", requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const userProfile = await kv.get(`user:${user.id}`);

    if (userProfile.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const body = await c.req.json();
    const { userId } = body;

    if (!userId) {
      return c.json({ error: 'Missing userId' }, 400);
    }

    const targetUser = await kv.get(`user:${userId}`);
    if (!targetUser) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Update user approval status
    targetUser.approved = true;
    await kv.set(`user:${userId}`, targetUser);

    // Update role-specific profile
    if (targetUser.role === 'hospital') {
      const hospitalProfile = await kv.get(`hospital:${userId}`);
      hospitalProfile.approved = true;
      await kv.set(`hospital:${userId}`, hospitalProfile);
    } else if (targetUser.role === 'sponsor') {
      const sponsorProfile = await kv.get(`sponsor:${userId}`);
      sponsorProfile.approved = true;
      await kv.set(`sponsor:${userId}`, sponsorProfile);
    }

    // Log audit event
    await kv.set(`audit:${Date.now()}:${user.id}`, {
      userId: user.id,
      action: 'USER_APPROVED',
      targetUserId: userId,
      role: targetUser.role,
      timestamp: new Date().toISOString()
    });

    return c.json({ success: true, user: targetUser });

  } catch (error) {
    console.log('Approval error:', error);
    return c.json({ error: `Failed to approve user: ${error}` }, 500);
  }
});

// Get audit logs
app.get("/make-server-db599f4a/admin/audit", requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const userProfile = await kv.get(`user:${user.id}`);

    if (userProfile.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const auditLogs = await kv.getByPrefix('audit:');
    
    // Sort by timestamp (most recent first)
    auditLogs.sort((a: any, b: any) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return c.json({ success: true, logs: auditLogs.slice(0, 100) }); // Return last 100 logs

  } catch (error) {
    console.log('Get audit logs error:', error);
    return c.json({ error: `Failed to get audit logs: ${error}` }, 500);
  }
});

// Get system stats
app.get("/make-server-db599f4a/admin/stats", requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const userProfile = await kv.get(`user:${user.id}`);

    if (userProfile.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const allUsers = await kv.getByPrefix('user:');
    const allCases = await kv.getByPrefix('case:');
    const allDonors = await kv.getByPrefix('donor:');

    const stats = {
      totalUsers: allUsers.length,
      totalPatients: allUsers.filter((u: any) => u.role === 'patient').length,
      totalDonors: allUsers.filter((u: any) => u.role === 'donor').length,
      totalHospitals: allUsers.filter((u: any) => u.role === 'hospital').length,
      totalSponsors: allUsers.filter((u: any) => u.role === 'sponsor').length,
      totalCases: allCases.length,
      waitingCases: allCases.filter((c: any) => c.status === 'waiting').length,
      matchedCases: allCases.filter((c: any) => c.status === 'matched').length,
      fundedCases: allCases.filter((c: any) => c.status === 'funded').length,
      transplantedCases: allCases.filter((c: any) => c.status === 'transplanted').length,
      donorsWithConsent: allDonors.filter((d: any) => d.consentGiven).length
    };

    return c.json({ success: true, stats });

  } catch (error) {
    console.log('Get stats error:', error);
    return c.json({ error: `Failed to get stats: ${error}` }, 500);
  }
});

Deno.serve(app.fetch);
