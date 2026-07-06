export {
  getMyPetsController,
  getPetByIdController,
  createPetController,
  updatePetController,
  deletePetController,
  restorePetController,
} from './pets.controller';
export { getPetsByOwner, getPetById, createPet, updatePet, deletePet, restorePet } from './pets.service';
export { default as petsRoutes } from './pets.routes';
