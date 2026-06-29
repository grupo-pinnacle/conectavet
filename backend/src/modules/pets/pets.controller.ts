import { Response } from 'express';
import { RequestWithUser } from '../../shared/middlewares/auth.middleware';
import { getPetsByOwner, getPetById, createPet, updatePet, deletePet } from './pets.service';

export async function getMyPetsController(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    const pets = await getPetsByOwner(req.user.userId);
    return res.status(200).json({ success: true, data: pets });
  } catch (error) {
    console.error('Error en getMyPetsController:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

export async function getPetByIdController(req: RequestWithUser, res: Response) {
  try {
    const pet = await getPetById(req.params.id as string);
    if (!pet) {
      return res.status(404).json({ success: false, message: 'Mascota no encontrada' });
    }
    return res.status(200).json({ success: true, data: pet });
  } catch (error) {
    console.error('Error en getPetByIdController:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
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
    const pet = await createPet({
      name,
      species,
      breed,
      age: age ? Number(age) : undefined,
      weight: weight ? Number(weight) : undefined,
      ownerId: req.user.userId,
    });
    return res.status(201).json({ success: true, data: pet });
  } catch (error) {
    console.error('Error en createPetController:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

export async function updatePetController(req: RequestWithUser, res: Response) {
  try {
    const { name, species, breed, age, weight } = req.body;
    const pet = await updatePet(req.params.id as string, {
      name, species, breed,
      age: age ? Number(age) : undefined,
      weight: weight ? Number(weight) : undefined,
    });
    return res.status(200).json({ success: true, data: pet });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Mascota no encontrada' });
    }
    console.error('Error en updatePetController:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

export async function deletePetController(req: RequestWithUser, res: Response) {
  try {
    await deletePet(req.params.id as string);
    return res.status(200).json({ success: true, message: 'Mascota eliminada' });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Mascota no encontrada' });
    }
    console.error('Error en deletePetController:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}
