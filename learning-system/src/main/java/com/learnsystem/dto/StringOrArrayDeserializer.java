package com.learnsystem.dto;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonToken;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.deser.std.StdDeserializer;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/**
 * Deserialises a JSON field that can be either a plain string or an array of strings.
 * Arrays are joined with a newline so the result is always a single String.
 *
 * Allows seed JSON files to write:
 *   "constraints": ["Must be ≥ 0", "Array is sorted"]
 * while the DTO/entity still stores a String.
 */
public class StringOrArrayDeserializer extends StdDeserializer<String> {

    public StringOrArrayDeserializer() {
        super(String.class);
    }

    @Override
    public String deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        if (p.currentToken() == JsonToken.START_ARRAY) {
            List<String> items = new ArrayList<>();
            while (p.nextToken() != JsonToken.END_ARRAY) {
                items.add(p.getText());
            }
            return String.join("\n", items);
        }
        return p.getValueAsString();
    }
}
