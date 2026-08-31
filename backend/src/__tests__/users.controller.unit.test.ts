import { Response } from 'express';
import { RequestWithUser } from '../shared/middlewares/auth.middleware';
import { createUserController } from '../modules/users/users.controller';
import * as usersService from '../modules/users/users.service';
import * as errorsModule from '../shared/errors';
import { createUserSchema } from '../modules/users/users.schemas';

// Mock the dependencies
jest.mock('../modules/users/users.service');
jest.mock('../shared/errors');

describe('createUserController', () => {
  let req: Partial<RequestWithUser>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = {
      body: {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'CLIENT',
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  it('should propagate the error to handleError when createUser throws an error', async () => {
    // Arrange
    const expectedError = new Error('Database error');
    (usersService.createUser as jest.Mock).mockRejectedValue(expectedError);

    // We also mock handleError to just return res.status(500) if we want,
    // but the test is mainly to ensure it's called with the correct args.
    (errorsModule.handleError as jest.Mock).mockReturnValue('handled error');

    // Make sure validation passes
    const validData = createUserSchema.safeParse(req.body);
    expect(validData.success).toBe(true);

    // Act
    await createUserController(req as RequestWithUser, res as Response);

    // Assert
    expect(usersService.createUser).toHaveBeenCalledTimes(1);
    expect(errorsModule.handleError).toHaveBeenCalledTimes(1);
    expect(errorsModule.handleError).toHaveBeenCalledWith(
      expectedError,
      res,
      'createUserController'
    );
  });
});
