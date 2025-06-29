import { sql } from '../../lib/db';
import { requireAuth } from '../../lib/auth';

export default async function handler(req, res) {
  const authResult = await requireAuth(req);
  
  if (!authResult.success) {
    return res.status(401).json(authResult);
  }

  const { user } = authResult;

  try {
    if (req.method === 'GET') {
      // Ottieni lavori di pulizia per l'operatore
      const { date_from, date_to } = req.query;
      
      const jobs = await sql`
        SELECT 
          cj.id,
          cj.type,
          cj.scheduled_date,
          cj.scheduled_time,
          cj.status,
          cj.priority,
          cj.notes,
          cj.completion_notes,
          cj.completed_at,
          p.id as property_id,
          p.name as property_name,
          p.address as property_address,
          r.guest_name,
          r.checkin_date,
          r.checkout_date
        FROM cleaning_jobs cj
        JOIN properties p ON cj.property_id = p.id
        JOIN operator_properties op ON p.id = op.property_id
        LEFT JOIN reservations r ON cj.reservation_id = r.id
        WHERE op.operator_id = ${user.id}
          AND cj.scheduled_date BETWEEN ${date_from || '2024-06-01'} AND ${date_to || '2024-12-31'}
        ORDER BY cj.scheduled_date, cj.scheduled_time
      `;

      res.status(200).json({ success: true, jobs });

    } else if (req.method === 'PUT') {
      // Aggiorna stato lavoro
      const { job_id, status, completion_notes } = req.body;

      if (!job_id || !status) {
        return res.status(400).json({ 
          success: false, 
          message: 'job_id e status richiesti' 
        });
      }

      // Verifica che il lavoro appartenga all'operatore
      const jobCheck = await sql`
        SELECT cj.id 
        FROM cleaning_jobs cj
        JOIN properties p ON cj.property_id = p.id
        JOIN operator_properties op ON p.id = op.property_id
        WHERE cj.id = ${job_id} AND op.operator_id = ${user.id}
      `;

      if (jobCheck.length === 0) {
        return res.status(403).json({ 
          success: false, 
          message: 'Non autorizzato' 
        });
      }

      // Aggiorna il lavoro
      const completed_at = status === 'completed' ? new Date().toISOString() : null;
      
      await sql`
        UPDATE cleaning_jobs 
        SET 
          status = ${status},
          completion_notes = ${completion_notes || null},
          completed_at = ${completed_at}
        WHERE id = ${job_id}
      `;

      res.status(200).json({ 
        success: true, 
        message: 'Stato aggiornato con successo' 
      });

    } else {
      res.status(405).json({ message: 'Metodo non consentito' });
    }

  } catch (error) {
    console.error('Errore API cleaning-jobs:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Errore interno del server' 
    });
  }
}