import { NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';
import type { UserRecord } from 'firebase-admin/auth';

// Check if user has admin privileges
async function verifyAdmin(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: 'Unauthorized', status: 401 };
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await getAdminAuth().verifyIdToken(token);
    
    // Check if user is the root admin (from env) or has the custom admin claim
    const isRootAdmin = decodedToken.email === process.env.NEXT_PUBLIC_ROOT_ADMIN_EMAIL;
    const isCustomAdmin = decodedToken.admin === true;

    if (!isRootAdmin && !isCustomAdmin) {
      return { error: 'Forbidden: Admin access required', status: 403 };
    }

    return { user: decodedToken };
  } catch (error) {
    console.error('Error verifying admin token:', error);
    return { error: 'Invalid token', status: 401 };
  }
}

export async function GET(request: Request) {
  const authCheck = await verifyAdmin(request);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  try {
    // List batch of users, 1000 at a time.
    const listUsersResult = await getAdminAuth().listUsers(1000);
    
    const users = listUsersResult.users.map((userRecord: UserRecord) => ({
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName || '이름 없음',
      photoURL: userRecord.photoURL,
      provider: userRecord.providerData.length > 0 ? userRecord.providerData[0].providerId : 'email',
      creationTime: userRecord.metadata.creationTime,
      lastSignInTime: userRecord.metadata.lastSignInTime,
      disabled: userRecord.disabled,
      isAdmin: userRecord.email === process.env.NEXT_PUBLIC_ROOT_ADMIN_EMAIL || userRecord.customClaims?.admin === true,
    }));

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error listing users:', error);
    const envStatus = {
      hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
      hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
      hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
      keyLength: process.env.FIREBASE_PRIVATE_KEY?.length || 0,
    };
    return NextResponse.json({ 
      error: 'Failed to fetch users', 
      details: String(error),
      envStatus
    }, { status: 500 });
  }
}
