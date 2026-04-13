package com.learnsystem.config;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonToken;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.deser.std.StdDeserializer;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Jackson deserializer that accepts either a JSON array or a plain string
 * for fields stored as TEXT (JSON array string) in the database.
 *
 * If the JSON value is an array  → serialises to "[\"item1\",\"item2\"]"
 * If the JSON value is a string  → passes through as-is
 * If the JSON value is null      → returns null
 */
public class StringArrayDeserializer extends StdDeserializer<String> {

    public StringArrayDeserializer() {
        super(String.class);
    }

    @Override
    public String deserialize(JsonParser p, DeserializationContext ctx) throws IOException {
        if (p.currentToken() == JsonToken.START_ARRAY) {
            List<String> items = new ArrayList<>();
            while (p.nextToken() != JsonToken.END_ARRAY) {
                items.add(p.getText());
            }
            if (items.isEmpty()) return null;
            return "[" + items.stream()
                .map(s -> "\"" + s.replace("\\", "\\\\").replace("\"", "\\\"") + "\"")
                .collect(Collectors.joining(",")) + "]";
        }
        String v = p.getValueAsString();
        return (v == null || v.isBlank()) ? null : v;
    }
}
