import { Response } from 'express';
import { RequestWithUser } from '../../shared/middlewares/auth.middleware';
import {
  createConsultation,
  assignVet,
  completeConsultation,
  getConsultationById,
  getConsultationsByUser,
  getAvailableVets,
  getMessages,
} from './consultations.service';

export async function createController(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    const { petId } = req.body;
    if (!petId) {
      return res.status(400).json({ success: false, message: 'petId es requerido' });
    }
    const consultation = await createConsultation({
      clientId: req.user.userId,
      petId,
    });
    return res.status(201).json({ success: true, data: consultation });
  } catch (error) {
    console.error('Error en createController:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

export async function assignVetController(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    if (req.user.role !== 'VET' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Solo veterinarios pueden tomar consultas' });
    }
    const consultation = await assignVet(req.params.id as string, req.user.userId);
    return res.status(200).json({ success: true, data: consultation });
  } catch (error) {
    console.error('Error en assignVetController:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

export async function completeController(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    const { notes } = req.body;
    const consultation = await completeConsultation(req.params.id as string, notes);
    return res.status(200).json({ success: true, data: consultation });
  } catch (error) {
    console.error('Error en completeController:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

export async function getByIdController(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    const consultation = await getConsultationById(req.params.id as string);
    if (!consultation) {
      return res.status(404).json({ success: false, message: 'Consulta no encontrada' });
    }
    return res.status(200).json({ success: true, data: consultation });
  } catch (error) {
    console.error('Error en getByIdController:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

export async function getMyConsultationsController(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    const consultations = await getConsultationsByUser(req.user.userId, req.user.role);
    return res.status(200).json({ success: true, data: consultations });
  } catch (error) {
    console.error('Error en getMyConsultationsController:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

export async function getAvailableVetsController(_req: RequestWithUser, res: Response) {
  try {
    const vets = await getAvailableVets();
    return res.status(200).json({ success: true, data: vets });
  } catch (error) {
    console.error('Error en getAvailableVetsController:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

export async function getMessagesController(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    const messages = await getMessages(req.params.id as string);
    return res.status(200).json({ success: true, data: messages });
  } catch (error) {
    console.error('Error en getMessagesController:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}
