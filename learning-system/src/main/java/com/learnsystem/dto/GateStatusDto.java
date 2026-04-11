package com.learnsystem.dto;

import lombok.Builder;
import lombok.Data;

/**
 * Describes where a user is in the learning gate for a topic.
 *
 * Stages (in order): THEORY → EASY → MEDIUM → HARD → MASTERED
 */
@Data
@Builder
public class GateStatusDto {

    /** Current stage the user is on */
    private String stage; // THEORY | EASY | MEDIUM | HARD | MASTERED

    /** Has the user completed the theory step? */
    private boolean theoryCompleted;

    /** The note the user submitted to unlock Easy problems */
    private String theoryNote;

    // ── Solved counts ──────────────────────────────────────────────────────────

    private int easySolved;
    private int easyTotal;

    private int mediumSolved;
    private int mediumTotal;

    private int hardSolved;
    private int hardTotal;

    // ── Gate thresholds ────────────────────────────────────────────────────────

    /** Number of Easy problems to solve before Medium problems unlock */
    private int easyRequiredToUnlockMedium;

    /** Number of Medium problems to solve before Hard problems unlock */
    private int mediumRequiredToUnlockHard;

    /** Number of Hard problems to solve to reach Mastered */
    private int hardRequiredToMaster;
}
