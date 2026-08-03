import { Response } from 'express';
import { z } from 'zod';
import { RequestWithUser } from '../../shared/middlewares/auth.middleware';
import { AppError, NotFoundError, ForbiddenError } from '../../shared/errors';
import { getPetsByOwner, getManagedPets, getPetById, createPet, updatePet, deletePet, restorePet, getPetVetCard } from './pets.service';

const createPetSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  species: z.string().min(1, 'La especie es requerida'),
  breed: z.string().optional(),
  age: z.coerce.number().int().positive('La edad debe ser un número positivo').optional(),
  weight: z.coerce.number().positive('El peso debe ser un número positivo').optional(),
  weightKg: z.coerce.number().positive().optional(),
  sex: z.enum(['MALE', 'FEMALE']).optional(),
  color: z.string().optional(),
  microchip: z.string().optional(),
  allergies: z.array(z.string()).optional(),
  chronicConditions: z.array(z.string()).optional(),
  birthDate: z.string().optional(),
  photoUrl: z.string().optional(),
});

const updatePetSchema = z.object({
  name: z.string().min(1).optional(),
  species: z.string().min(1).optional(),
  breed: z.string().optional(),
  age: z.coerce.number().int().positive().optional(),
  weight: z.coerce.number().positive().optional(),
  weightKg: z.coerce.number().positive().optional(),
  sex: z.enum(['MALE', 'FEMALE']).optional(),
  color: z.string().optional(),
  microchip: z.string().optional(),
  allergies: z.array(z.string()).optional(),
  chronicConditions: z.array(z.string()).optional(),
  birthDate: z.string().optional(),
  photoUrl: z.string().optional(),
});

function handleError(error: unknown, res: Response) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }
  console.error('Error en pets controller:', error);
  return res.status(500).json({ success: false, message: 'Error interno del servidor' });
}

export async function getManagedPetsController(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'No autenticado' });
    if (req.user.role !== 'VET' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Solo veterinarios' });
    }
    const pets = await getManagedPets(req.user.userId);
    return res.status(200).json({ success: true, data: pets });
  } catch (error) {
    return handleError(error, res);
  }
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

export async function getPetVetCardController(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    const vetCard = await getPetVetCard(req.params.id as string);
    if (!vetCard) {
      throw new NotFoundError('Mascota no encontrada');
    }
    if (vetCard.pet.ownerId !== req.user.userId && req.user.role === 'CLIENT') {
      throw new ForbiddenError('No tenés permiso para ver esta mascota');
    }
    return res.status(200).json({ success: true, data: vetCard });
  } catch (error) {
    return handleError(error, res);
  }
}

export async function createPetController(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    const parsed = createPetSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: parsed.error.issues[0].message });
    }
    const pet = await createPet({ ...parsed.data, ownerId: req.user.userId });
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
    const parsed = updatePetSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: parsed.error.issues[0].message });
    }
    const updated = await updatePet(req.params.id as string, parsed.data);
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
