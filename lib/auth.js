import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { sql } from './db';

export async function hashPassword(password) {
  return await bcrypt.hash(password, 12);
}

export async function verifyPassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

export function generateToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET || 'fallback-secret', {
    expiresIn: '24h'
  });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
  } catch (error) {
    return null;
  }
}

export async function authenticateUser(username, password) {
  try {
    const operators = await sql`
      SELECT id, username, password, name, email 
      FROM operators 
      WHERE username = ${username}
    `;

    if (operators.length === 0) {
      return { success: false, message: 'Credenziali non valide' };
    }

    const operator = operators[0];
    const isValidPassword = await verifyPassword(password, operator.password);

    if (!isValidPassword) {
      return { success: false, message: 'Credenziali non valide' };
    }

    const token = generateToken({
      id: operator.id,
      username: operator.username,
      name: operator.name
    });

    return {
      success: true,
      token,
      operator: {
        id: operator.id,
        username: operator.username,
        name: operator.name,
        email: operator.email
      }
    };
  } catch (error) {
    console.error('Errore autenticazione:', error);
    return { success: false, message: 'Errore server' };
  }
}

export function getAuthToken(req) {
  const authHeader = req.headers.authorization;
  return authHeader && authHeader.split(' ')[1];
}

export async function requireAuth(req) {
  const token = getAuthToken(req);
  
  if (!token) {
    return { success: false, message: 'Token richiesto' };
  }

  const decoded = verifyToken(token);
  
  if (!decoded) {
    return { success: false, message: 'Token non valido' };
  }

  return { success: true, user: decoded };
}