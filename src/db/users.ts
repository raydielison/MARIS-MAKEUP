import { db } from './index.ts';
import { users } from './schema.ts';
import { eq } from 'drizzle-orm';

export async function getOrCreateUser(uid: string, email: string, name?: string, role: string = 'VENDEDOR') {
  try {
    const result = await db
      .insert(users)
      .values({
        id: `usr_${uid}`,
        uid,
        email,
        name: name || email.split('@')[0],
        role,
        active: true,
        createdAt: new Date().toISOString(),
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          ...(name ? { name } : {}),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database query failed in getOrCreateUser:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function getAllUsers() {
  try {
    return await db.select().from(users);
  } catch (error) {
    console.error('Database query failed in getAllUsers:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function getUserByEmail(email: string) {
  try {
    const results = await db.select().from(users).where(eq(users.email, email));
    return results[0] || null;
  } catch (error) {
    console.error('Database query failed in getUserByEmail:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}
