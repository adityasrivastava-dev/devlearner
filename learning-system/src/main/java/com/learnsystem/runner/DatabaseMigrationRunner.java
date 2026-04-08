package com.learnsystem.runner;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Runs before SeedDataRunner (@Order(1)) to fix any column-type mismatches
 * that Hibernate's ddl-auto=update refuses to change on existing columns.
 *
 * Problem: Hibernate creates VARCHAR(255) for @Column without columnDefinition.
 * Even after adding columnDefinition="TEXT" to the entity, Hibernate update mode
 * never widens an existing column — it only adds missing columns.
 *
 * Solution: Run idempotent ALTER TABLE statements at startup (order = 1).
 * Each statement uses MODIFY COLUMN only if the column is not already TEXT/LONGTEXT,
 * so restarting the server multiple times is safe.
 */
@Component
@Order(1)                   // runs BEFORE SeedDataRunner (which has no @Order = Integer.MAX_VALUE)
@RequiredArgsConstructor
@Slf4j
public class DatabaseMigrationRunner implements ApplicationRunner {

private final JdbcTemplate jdbc;

@Override
public void run(ApplicationArguments args) {
	log.info("DatabaseMigrationRunner: checking column types...");

	// ── examples.real_world_use ───────────────────────────────────────────
	// Was created as VARCHAR(255) — must be TEXT to hold seed content.
	alterColumnIfNotText("examples", "real_world_use",
			"ALTER TABLE examples MODIFY COLUMN real_world_use TEXT");

	// ── Defensive: any other VARCHAR(255) columns that store long content ──
	alterColumnIfNotText("examples", "explanation",
			"ALTER TABLE examples MODIFY COLUMN explanation TEXT");

	log.info("DatabaseMigrationRunner: column checks complete.");
}

/**
 * Runs the given ALTER only when the column's current DATA_TYPE is not
 * already TEXT, MEDIUMTEXT, or LONGTEXT — making it fully idempotent.
 */
private void alterColumnIfNotText(String table, String column, String alterSql) {
	try {
		String dataType = jdbc.queryForObject(
				"SELECT DATA_TYPE FROM information_schema.COLUMNS " +
						"WHERE TABLE_SCHEMA = DATABASE() " +
						"  AND TABLE_NAME   = ? " +
						"  AND COLUMN_NAME  = ?",
				String.class, table, column);

		if (dataType == null) {
			log.warn("DatabaseMigrationRunner: column {}.{} not found — skipping.", table, column);
			return;
		}

		if (dataType.toLowerCase().contains("text")) {
			log.debug("DatabaseMigrationRunner: {}.{} is already {} — no change needed.",
					table, column, dataType);
			return;
		}

		log.info("DatabaseMigrationRunner: {}.{} is {} — altering to TEXT...",
				table, column, dataType);
		jdbc.execute(alterSql);
		log.info("DatabaseMigrationRunner: {}.{} altered successfully.", table, column);

	} catch (Exception e) {
		// Log but don't crash startup — the seed runner will surface the real error.
		log.error("DatabaseMigrationRunner: failed to alter {}.{}: {}", table, column, e.getMessage());
	}
}
}