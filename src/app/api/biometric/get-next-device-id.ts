import { NextApiRequest, NextApiResponse } from 'next';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const supabase = createBrowserSupabaseClient();
    
    // Obtener el máximo device_user_id actual
    const { data, error } = await supabase
      .from('device_user_mappings')
      .select('device_user_id')
      .order('device_user_id', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      throw error;
    }
    
    // Si no hay registros, empezar desde 1
    const maxId = data?.device_user_id || 0;
    const nextId = maxId + 1;
    
    console.log(`[API] Máximo device_user_id actual: ${maxId}, siguiente: ${nextId}`);
    
    res.status(200).json({ 
      success: true, 
      nextId,
      currentMax: maxId
    });
    
  } catch (error: any) {
    console.error('[API] Error obteniendo siguiente ID:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      nextId: 1 // Fallback
    });
  }
}
