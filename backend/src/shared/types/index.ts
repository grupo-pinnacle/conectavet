import { Role } from '@prisma/client';

import { Request } from 'express';
export interface JwtPayload {

userId: string;

email: string;

role: Role;

}
export interface ApiResponse<T> {

success: boolean;

data?: T;

message?: string;

}
export interface PaginationParams {

page: number;

limit: number;

}
export interface RequestWithUser extends Request {

user?: JwtPayload;

}