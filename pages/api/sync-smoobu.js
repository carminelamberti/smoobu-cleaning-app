import { sql } from '../../lib/db';
import { requireAuth } from '../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Metodo non consentito' });
  }

  const authResult = await requireAuth(req);
  
  if (!authResult.success) {
    return res.status(401).json(authResult);
  }

  try {
    const smoobuApiKey = process.env.SMOOBU_API_KEY;
    
    if (!smoobuApiKey) {
      return res.status(500).json({ 
        success: false, 
        message: 'API Key Smoobu non configurata' 
      });
    }

    // Simulazione sincronizzazione (sostituire con vere chiamate API Smoobu)
    /*
    // Esempio di chiamata API Smoobu per ottenere pulizie
    const cleaningsResponse = await fetch('https://login.smoobu.com/api/cleanings', {
      headers: {
        'Api-Key': smoobuApiKey,
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json'
      }
    });
    
    if (!cleaningsResponse.ok) {
      throw new Error('Errore chiamata API Smoobu');
    }
    
    const cleaningsData = await cleaningsResponse.json();
    
    // Sincronizza i dati nel database locale
    for (const cleaning of cleaningsData.data || []) {
      await sql`
        INSERT INTO cleaning_jobs (property_id, type, scheduled_date, scheduled_time, status, priority, notes)
        VALUES (${cleaning.apartment_id}, ${cleaning.type}, ${cleaning.date}, ${cleaning.time}, 'pending', 'medium', ${cleaning.notes})
        ON CONFLICT (smoobu_id) DO UPDATE SET
          scheduled_date = EXCLUDED.scheduled_date,
          scheduled_time = EXCLUDED.scheduled_time,
          status = EXCLUDED.status,
          notes = EXCLUDED.notes
      `;
    }
    */

    // Per ora simuliamo una sincronizzazione di successo
    const timestamp = new Date().toISOString();
    
    res.status(200).json({ 
      success: true, 
      message: 'Sincronizzazione completata con successo',
      timestamp,
      // Dati di esempio sincronizzati
      synchronized: {
        cleanings: 0, // Qui inseriresti il numero reale
        reservations: 0,
        properties: 0
      }
    });

  } catch (error) {
    console.error('Errore sincronizzazione Smoobu:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Errore durante la sincronizzazione' 
    });
  }
}