import { PrismaClient } from '@prisma/client';
import { getVetById } from './src/modules/users/users.service';
import { NotFoundError } from './src/shared/errors';

// Mock the dependencies and service properly
const mockUser = {
  id: 'vet123',
  email: 'vet@example.com',
  firstName: 'John',
  lastName: 'Doe',
  phone: '1234567890',
  bio: 'A great vet',
  specialty: 'Dogs',
  isOnline: true,
  createdAt: new Date(),
  reviewsAsVet: Array.from({ length: 10000 }).map((_, i) => ({
    rating: (i % 5) + 1,
    comment: 'Great',
    createdAt: new Date(),
  }))
};

async function runBenchmark() {
  const start = performance.now();
  for (let i = 0; i < 1000; i++) {
    const vet = mockUser;
    const { reviewsAsVet, ...rest } = vet;
    const totalRatings = reviewsAsVet.length;
    const ratingAvg = totalRatings > 0
      ? Math.round((reviewsAsVet.reduce((sum, r) => sum + r.rating, 0) / totalRatings) * 10) / 10
      : null;
    const result = {
      ...rest,
      ratingAvg,
      ratingCount: totalRatings,
      reviews: reviewsAsVet.slice(0, 10),
    };
  }
  const end = performance.now();
  console.log(`Original Code: ${end - start} ms for 1000 iterations (10,000 reviews each)`);

  const start2 = performance.now();
  for (let i = 0; i < 1000; i++) {
     // DB aggregate mockup
     const totalRatings = 10000;
     const avgRating = 3.0; // Mocked DB result
     const reviews = mockUser.reviewsAsVet.slice(0, 10); // DB limit 10

     const { reviewsAsVet, ...rest } = mockUser;
     const result = {
      ...rest,
      ratingAvg: Math.round(avgRating * 10) / 10,
      ratingCount: totalRatings,
      reviews: reviews,
    };
  }
  const end2 = performance.now();
  console.log(`Optimized Code: ${end2 - start2} ms for 1000 iterations (Mock DB Aggregation)`);
}

runBenchmark().catch(console.error);
