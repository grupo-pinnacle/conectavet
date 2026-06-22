## Endpoints de autenticación

### POST /api/auth/register
Body: { email, password, role }
role debe ser CLIENT, VET o ADMIN
Respuesta exitosa: 201 con el usuario creado (sin password)
Errores: 400 datos inválidos, 409 email ya registrado

### POST /api/auth/login
Body: { email, password }
Respuesta exitosa: 200 con { token, user }
Errores: 400 datos faltantes, 401 credenciales inválidas

### GET /api/users/me
Requiere header Authorization: Bearer <token>
Respuesta exitosa: 200 con los datos del usuario autenticado
Errores: 401 sin token o token inválido, 404 usuario no encontrado

### GET /api/users/admin-only
Requiere header Authorization: Bearer <token>
Respuesta exitosa: 200 solo si el usuario tiene rol ADMIN
Errores: 401 sin token o token inválido, 403 si el rol no tiene permisos
