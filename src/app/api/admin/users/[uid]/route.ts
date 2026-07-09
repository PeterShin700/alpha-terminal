import { NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';

async function verifyAdmin(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: 'Unauthorized', status: 401 };
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await getAdminAuth().verifyIdToken(token);
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

export async function PATCH(request: Request, { params }: { params: { uid: string } }) {
  const authCheck = await verifyAdmin(request);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  try {
    const body = await request.json();
    const uid = params.uid;

    if (body.action === 'toggle_admin') {
      const user = await getAdminAuth().getUser(uid);
      const isCurrentlyAdmin = user.customClaims?.admin === true;
      
      // Toggle custom claims
      await getAdminAuth().setCustomUserClaims(uid, { ...user.customClaims, admin: !isCurrentlyAdmin });
      return NextResponse.json({ success: true, message: `Admin status ${!isCurrentlyAdmin ? 'granted' : 'revoked'}` });
    }
    
    if (body.action === 'toggle_disabled') {
      const user = await getAdminAuth().getUser(uid);
      await getAdminAuth().updateUser(uid, { disabled: !user.disabled });
      return NextResponse.json({ success: true, message: `Account ${!user.disabled ? 'disabled' : 'enabled'}` });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { uid: string } }) {
  const authCheck = await verifyAdmin(request);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  try {
    const uid = params.uid;
    await getAdminAuth().deleteUser(uid);
    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
