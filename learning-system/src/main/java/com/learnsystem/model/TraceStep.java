package com.learnsystem.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TraceStep {

    private int stepNumber;

    /** 0-based index into codeLines that is currently executing */
    private int highlightLine;

    /** Human-readable explanation of what happened in this step */
    private String description;

    /** Current value of every tracked variable.
     *  LinkedHashMap so insertion order is preserved for display. */
    private LinkedHashMap<String, String> variables;

    /** Which variable names changed compared to the previous step */
    private Set<String> changedVars;

    /** The canonical algorithm code split into lines (same for every step) */
    private List<String> codeLines;

    /** Phase token for frontend colour coding */
    private String phase; // INIT | LOOP_CHECK | COMPUTE | COMPARE | FOUND | GO_LEFT | GO_RIGHT | NOT_FOUND
}
