import { Response } from 'express';
import { RequestWithUser } from '../../shared/middlewares/auth.middleware';
import { AppError, NotFoundError, ForbiddenError } from '../../shared/errors';
import { getPetsByOwner, getPetById, createPet, updatePet, deletePet, restorePet } from './pets.service';

function handleError(error: unknown, res: Response) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }
  console.error('Error en pets controller:', error);
  return res.status(500).json({ success: false, message: 'Error interno del servidor' });
}

export async function getMyPetsController(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const result = await getPetsByOwner(req.user.userId, page, limit);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return handleError(error, res);
  }
}

export async function getPetByIdController(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    const pet = await getPetById(req.params.id as string);
    if (!pet || pet.deletedAt) {
      throw new NotFoundError('Mascota no encontrada');
    }
    if (pet.ownerId !== req.user.userId && req.user.role === 'CLIENT') {
      throw new ForbiddenError('No tenés permiso para ver esta mascota');
    }
    return res.status(200).json({ success: true, data: pet });
  } catch (error) {
    return handleError(error, res);
  }
}

export async function createPetController(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    const { name, species, breed, age, weight } = req.body;
    if (!name || !species) {
      return res.status(400).json({ success: false, message: 'Nombre y especie son requeridos' });
    }
    const ageNum = age !== undefined ? Number(age) : undefined;
    const weightNum = weight !== undefined ? Number(weight) : undefined;
    if ((age !== undefined && isNaN(ageNum!)) || (weight !== undefined && isNaN(weightNum!))) {
      return res.status(400).json({ success: false, message: 'Edad y peso deben ser números' });
    }
    const pet = await createPet({
      name, species, breed,
      age: ageNum,
      weight: weightNum,
      ownerId: req.user.userId,
    });
    return res.status(201).json({ success: true, data: pet });
  } catch (error) {
    return handleError(error, res);
  }
}

async function verifyPetOwnership(petId: string, userId: string): Promise<{ allowed: boolean; pet: any }> {
  const pet = await getPetById(petId);
  if (!pet || pet.deletedAt) return { allowed: false, pet: null };
  if (pet.ownerId !== userId) return { allowed: false, pet };
  return { allowed: true, pet };
}

export async function updatePetController(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    const { allowed, pet } = await verifyPetOwnership(req.params.id as string, req.user.userId);
    if (!pet) {
      throw new NotFoundError('Mascota no encontrada');
    }
    if (!allowed) {
      throw new ForbiddenError('No tenés permiso para modificar esta mascota');
    }
    const { name, species, breed, age, weight } = req.body;
    const updated = await updatePet(req.params.id as string, {
      name, species, breed,
      age: age !== undefined ? Number(age) : undefined,
      weight: weight !== undefined ? Number(weight) : undefined,
    });
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    return handleError(error, res);
  }
}

export async function deletePetController(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    const { allowed, pet } = await verifyPetOwnership(req.params.id as string, req.user.userId);
    if (!pet) {
      throw new NotFoundError('Mascota no encontrada');
    }
    if (!allowed) {
      throw new ForbiddenError('No tenés permiso para eliminar esta mascota');
    }
    await deletePet(req.params.id as string);
    return res.status(200).json({ success: true, message: 'Mascota eliminada' });
  } catch (error) {
    return handleError(error, res);
  }
}

export async function restorePetController(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    const pet = await restorePet(req.params.id as string, req.user.userId);
    if (!pet) {
      throw new NotFoundError('Mascota no encontrada o no tenés permiso');
    }
    return res.status(200).json({ success: true, data: pet });
  } catch (error) {
    return handleError(error, res);
  }
}
