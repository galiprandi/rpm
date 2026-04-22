-- Close orphaned cash registers (OPENING without CLOSING)
-- This script finds all OPENING movements without a corresponding CLOSING
-- and creates a CLOSING movement with the calculated expected amount

DO $$
DECLARE
    opening_record RECORD;
    closing_exists BOOLEAN;
    expected_amount NUMERIC;
    movement_record RECORD;
BEGIN
    -- Log start
    RAISE NOTICE 'Buscando cajas abiertas sin cierre...';

    -- Loop through all OPENING movements
    FOR opening_record IN
        SELECT id, "createdAt", amount
        FROM cash_movement
        WHERE type = 'OPENING'
        ORDER BY "createdAt" DESC
    LOOP
        -- Check if there's a CLOSING after this OPENING
        SELECT EXISTS(
            SELECT 1 FROM cash_movement
            WHERE type = 'CLOSING'
            AND "createdAt" >= opening_record."createdAt"
        ) INTO closing_exists;

        IF NOT closing_exists THEN
            -- Calculate expected amount
            expected_amount := opening_record.amount;

            -- Add all INCOME movements
            FOR movement_record IN
                SELECT amount FROM cash_movement
                WHERE type = 'INCOME'
                AND "createdAt" >= opening_record."createdAt"
            LOOP
                expected_amount := expected_amount + movement_record.amount;
            END LOOP;

            -- Subtract all EXPENSE movements
            FOR movement_record IN
                SELECT amount FROM cash_movement
                WHERE type = 'EXPENSE'
                AND "createdAt" >= opening_record."createdAt"
            LOOP
                expected_amount := expected_amount - movement_record.amount;
            END LOOP;

            -- Create CLOSING movement with manual ID generation
            INSERT INTO cash_movement (
                id,
                type,
                amount,
                method,
                "referenceType",
                reason,
                notes,
                "createdAt",
                "createdBy"
            ) VALUES (
                'clm_' || extract(epoch from now())::bigint || '_' || floor(random() * 1000000)::text,
                'CLOSING',
                expected_amount,
                'CASH',
                'manual',
                'Cierre forzado por migración',
                'Cierre automático de caja abierta el ' || opening_record."createdAt",
                NOW(),
                'SYSTEM_MIGRATION'
            );

            RAISE NOTICE '✅ Cerrada caja abierta el % - Monto: $%',
                opening_record."createdAt",
                expected_amount;
        END IF;
    END LOOP;

    RAISE NOTICE '✨ Proceso completado';
END $$;
