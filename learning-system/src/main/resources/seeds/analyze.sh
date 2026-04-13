#!/bin/bash

# Simple JSON key-value extractor (handles single-line values)
extract_field() {
    local file=$1
    local field=$2
    grep "\"${field}\":" "$file" | head -1 | sed 's/.*"'"${field}"'":\s*"\(.*\)".*/\1/' | cut -c1-80
}

# List of files to process
files=(B01-jvm-architecture.json B02-compilation-flow.json B03-data-types.json B04-java-operators.json B05-control-flow.json B06-arrays.json B07-strings.json B08-methods.json B09-pass-by-value.json B10-memory-management.json B11-class-and-object.json B12-inheritance.json B13-polymorphism.json B14-abstraction.json B15-encapsulation.json B16-generics.json B17-collections.json B18-exception-handling.json B19-streams-functional.json B20-io-nio.json B21-concurrency-threads.json B22-design-patterns.json S01-spring-core.json S02-spring-boot.json S03-spring-security.json S04-spring-jpa.json S05-rest-api-design.json S06-microservices.json D01-linked-list.json D02-stack-queue.json D03-trees.json D04-heaps-priority-queues.json D05-graphs.json D06-sorting-algorithms.json D07-dynamic-programming.json D08-recursion-backtracking.json D09-trie-advanced-trees.json)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        title=$(extract_field "$file" "title")
        echo "FILE: $file"
        echo "TITLE: $title"
        echo "---"
    fi
done
