import { Response } from 'express';
import { RequestWithUser } from '../../shared/middlewares/auth.middleware';
import { NotFoundError, ForbiddenError, handleError } from '../../shared/errors';
import { getPetsByOwner, getManagedPets, getPetById, createPet, updatePet, deletePet, restorePet, getPetVetCard, vetHasConsultationForPet } from './pets.service';
import { parsePagination } from '../../shared/utils';

const dateStringSchema = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), 'Fecha de nacimiento inválida');
export const getManagedPetsController = asyncHandler(async (req: RequestWithUser, res: Response) => {
if (!req.user) return res.status(401).json({ success: false, message: 'No autenticado' });
if (req.user.role !== 'VET' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Solo veterinarios' });
    }
const { page, limit } = parsePagination(req.query as Record<string, string>);
const result = await getManagedPets(req.user.userId, page, limit);
return res.status(200).json({ success: true, ...result });
});

export const getMyPetsController = asyncHandler(async (req: RequestWithUser, res: Response) => {
if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
const { page, limit } = parsePagination(req.query as Record<string, string>);
const result = await getPetsByOwner(req.user.userId, page, limit);
return res.status(200).json({ success: true, ...result });
});

export const getPetByIdController = asyncHandler(async (req: RequestWithUser, res: Response) => {
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
if (req.user.role === 'VET' && pet.ownerId !== req.user.userId) {
      const allowed = await vetHasConsultationForPet(req.user.userId, pet.id);
      if (!allowed) {
        throw new ForbiddenError('No tenés permiso para ver esta mascota');
      }
    }
return res.status(200).json({ success: true, data: pet });
});

export const getPetVetCardController = asyncHandler(async (req: RequestWithUser, res: Response) => {
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
});

export const createPetController = asyncHandler(async (req: RequestWithUser, res: Response) => {
if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
const pet = await createPet({ ...req.body, ownerId: req.user.userId });
return res.status(201).json({ success: true, data: pet });
});

import { Pet } from '@prisma/client';
import { asyncHandler } from "../../shared/middlewares/async.middleware.js";

async function verifyPetOwnership(petId: string, userId: string): Promise<{ allowed: boolean; pet: Pet | null }> {
  const pet = await getPetById(petId) as Pet | null;
  if (!pet || pet.deletedAt) return { allowed: false, pet: null };
  if (pet.ownerId !== userId) return { allowed: false, pet };
  return { allowed: true, pet };
}

export const updatePetController = asyncHandler(async (req: RequestWithUser, res: Response) => {
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
const updated = await updatePet(req.params.id as string, req.body);
return res.status(200).json({ success: true, data: updated });
});

export const deletePetController = asyncHandler(async (req: RequestWithUser, res: Response) => {
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
});

export const restorePetController = asyncHandler(async (req: RequestWithUser, res: Response) => {
if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
const pet = await restorePet(req.params.id as string, req.user.userId);
if (!pet) {
      throw new NotFoundError('Mascota no encontrada o no tenés permiso');
    }
return res.status(200).json({ success: true, data: pet });
});
