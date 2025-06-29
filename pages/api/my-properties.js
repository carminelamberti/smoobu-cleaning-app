import { sql } from '../../lib/db';
import { requireAuth } from '../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Metodo non consentito' });
  }

  const authResult = await requireAuth(req);
  
  if (!authResult.success) {
    return res.status(401).json(authResult);
  }

  const { user } = authResult;

  try {
    const properties = await sql`
      SELECT 
        p.id,
        p.smoobu_id,
        p.name,
        p.address,
        p.type
      FROM properties p
      JOIN operator_properties op ON p.id = op.property_id
      WHERE op.operator_id = ${user.id}
      ORDER BY p.name
    `;

    res.status(200).json({ 
      success: true, 
      properties 
    });

  } catch (error) {
    console.error('Errore API my-properties:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Errore interno del server' 
    });
  }
}