import { authenticateUser } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Metodo non consentito' });
  }

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username e password richiesti' 
      });
    }

    const result = await authenticateUser(username, password);

    if (!result.success) {
      return res.status(401).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Errore login:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Errore interno del server' 
    });
  }
}