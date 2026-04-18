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
	alterColumnIfNotText("examples", "real_world_use",
			"ALTER TABLE examples MODIFY COLUMN real_world_use TEXT");
	alterColumnIfNotText("examples", "explanation",
			"ALTER TABLE examples MODIFY COLUMN explanation TEXT");

	// ── execution_jobs.status ─────────────────────────────────────────────
	// If the column is a MySQL ENUM (fixed list) or VARCHAR too short,
	// inserting 'STARTED' gives "Data truncated". Ensure it is VARCHAR(10).
	ensureVarcharMinLength("execution_jobs", "status", 10,
			"ALTER TABLE execution_jobs MODIFY COLUMN status VARCHAR(10) NOT NULL DEFAULT 'PENDING'");

	// ── execution_jobs.job_type ──────────────────────────────────────────
	// TEST_RUN (8 chars) was added to the enum. If MySQL created job_type as
	// an ENUM('RUN','SUBMIT') rather than VARCHAR, inserting 'TEST_RUN' would
	// give "Data truncated". Ensure it is VARCHAR(10) just like status.
	ensureVarcharMinLength("execution_jobs", "job_type", 10,
			"ALTER TABLE execution_jobs MODIFY COLUMN job_type VARCHAR(10) NOT NULL DEFAULT 'RUN'");

	// ── execution_jobs.token ──────────────────────────────────────────────
	// Non-guessable polling token added to replace raw integer IDs in URLs.
	// Added as NULL so existing rows without a token don't violate constraints.
	addColumnIfMissing("execution_jobs", "token",
			"ALTER TABLE execution_jobs ADD COLUMN token VARCHAR(16) NULL");

	// ── problems.code_harness ─────────────────────────────────────────────
	// Hidden runner harness for method-based problems (LeetCode-style).
	// Hibernate will create it via ddl-auto=update but this ensures existing
	// Railway DBs get the column without a full schema recreate.
	addColumnIfMissing("problems", "code_harness",
			"ALTER TABLE problems ADD COLUMN code_harness LONGTEXT NULL");

	// ── FULLTEXT indexes for global search ───────────────────────────────────
	addFullTextIndexIfMissing("topics",    "ft_topics_search",    "title, description, memory_anchor");
	addFullTextIndexIfMissing("problems",  "ft_problems_search",  "title, description, pattern");
	addFullTextIndexIfMissing("algorithms","ft_algorithms_search","name, description");

	log.info("DatabaseMigrationRunner: column checks complete.");
}

/**
 * Ensures a column is VARCHAR with at least minLength characters.
 * Also handles the case where the column is a MySQL ENUM type — ENUM
 * columns report a CHARACTER_MAXIMUM_LENGTH equal to their longest value,
 * but inserting any value not in the ENUM list gives "Data truncated".
 * The DATA_TYPE check catches both cases.
 */
private void ensureVarcharMinLength(String table, String column, int minLength, String alterSql) {
	try {
		String[] row = jdbc.queryForObject(
				"SELECT DATA_TYPE, CHARACTER_MAXIMUM_LENGTH " +
				"FROM information_schema.COLUMNS " +
				"WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",
				(rs, n) -> new String[]{ rs.getString(1), rs.getString(2) },
				table, column);

		if (row == null) {
			log.warn("DatabaseMigrationRunner: column {}.{} not found — skipping.", table, column);
			return;
		}

		String dataType = row[0];
		int    currentLen = row[1] != null ? Integer.parseInt(row[1]) : 0;

		boolean isVarcharLargeEnough = "varchar".equalsIgnoreCase(dataType) && currentLen >= minLength;
		if (isVarcharLargeEnough) {
			log.debug("DatabaseMigrationRunner: {}.{} is VARCHAR({}) — no change needed.", table, column, currentLen);
			return;
		}

		log.info("DatabaseMigrationRunner: {}.{} is {} ({}) — altering to VARCHAR({})...",
				table, column, dataType, currentLen, minLength);
		jdbc.execute(alterSql);
		log.info("DatabaseMigrationRunner: {}.{} altered successfully.", table, column);

	} catch (Exception e) {
		log.error("DatabaseMigrationRunner: failed to check/alter {}.{}: {}", table, column, e.getMessage());
	}
}

/**
 * Adds a column only if it doesn't already exist — fully idempotent.
 */
private void addColumnIfMissing(String table, String column, String alterSql) {
	try {
		Integer count = jdbc.queryForObject(
				"SELECT COUNT(*) FROM information_schema.COLUMNS " +
				"WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",
				Integer.class, table, column);

		if (count != null && count > 0) {
			log.debug("DatabaseMigrationRunner: {}.{} already exists — skipping.", table, column);
			return;
		}

		log.info("DatabaseMigrationRunner: adding column {}.{}...", table, column);
		jdbc.execute(alterSql);
		log.info("DatabaseMigrationRunner: {}.{} added successfully.", table, column);

	} catch (Exception e) {
		log.error("DatabaseMigrationRunner: failed to add {}.{}: {}", table, column, e.getMessage());
	}
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

private void addFullTextIndexIfMissing(String table, String indexName, String columns) {
	try {
		Integer count = jdbc.queryForObject(
				"SELECT COUNT(*) FROM information_schema.STATISTICS " +
				"WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?",
				Integer.class, table, indexName);

		if (count != null && count > 0) {
			log.debug("DatabaseMigrationRunner: FULLTEXT index {} on {} already exists — skipping.", indexName, table);
			return;
		}

		log.info("DatabaseMigrationRunner: creating FULLTEXT index {} on {}({})...", indexName, table, columns);
		jdbc.execute("ALTER TABLE " + table + " ADD FULLTEXT INDEX " + indexName + " (" + columns + ")");
		log.info("DatabaseMigrationRunner: FULLTEXT index {} created.", indexName);

	} catch (Exception e) {
		log.error("DatabaseMigrationRunner: failed to create FULLTEXT index {} on {}: {}", indexName, table, e.getMessage());
	}
}
}