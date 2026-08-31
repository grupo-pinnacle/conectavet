# VetConnect - Production Runbooks & Disaster Recovery

## Disaster Recovery Objectives (DR)
- **RTO (Recovery Time Objective):** < 15 minutos. Restaurar el servicio o la base de datos a un punto operativo debe tomar como máximo 15 minutos.
- **RPO (Recovery Point Objective):** < 5 minutos. Con Supabase PITR (Point-in-Time Recovery) habilitado, la pérdida máxima de datos permitida en caso de caída catastrófica es de 5 minutos, garantizado por el streaming continuo de WAls.

