package com.learnsystem.controller;

import com.learnsystem.dto.SeedBatchResponse;
import com.learnsystem.service.PdfImportService;
import com.learnsystem.service.PdfImportService.PdfImportResult;
import com.learnsystem.service.SeedBatchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class PdfImportController {

private final PdfImportService pdfImportService;
private final SeedBatchService seedBatchService;

/** Preview — parse PDF and return topic suggestions (not saved) */
@PostMapping(value = "/import-pdf/preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public ResponseEntity<?> preview(
		@RequestPart("file") MultipartFile file,
		@RequestPart(value = "category", required = false) String category) {
	if (file == null || file.isEmpty())
		return ResponseEntity.badRequest().body(Map.of("error", "No file uploaded"));
	if (!file.getOriginalFilename().toLowerCase().endsWith(".pdf"))
		return ResponseEntity.badRequest().body(Map.of("error", "Only PDF files supported"));
	try {
		PdfImportResult result = pdfImportService.importPdf(file, category != null ? category : "DSA");
		return ResponseEntity.ok(Map.of(
				"filename",        result.filename(),
				"totalPages",      result.totalPages(),
				"detectionMethod", result.detectionMethod(),
				"topicCount",      result.topicCount(),
				"topics",          result.topics().stream().map(t -> Map.of(
						"title",       t.getTitle(),
						"category",    t.getCategory(),
						"description", t.getDescription() != null ? t.getDescription() : ""
				)).collect(Collectors.toList())
		));
	} catch (IOException e) {
		return ResponseEntity.internalServerError()
				.body(Map.of("error", "Failed to parse PDF: " + e.getMessage()));
	}
}

/** Save — parse PDF and save all topics to DB */
@PostMapping(value = "/import-pdf/save", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public ResponseEntity<?> saveAll(
		@RequestPart("file") MultipartFile file,
		@RequestPart(value = "category", required = false) String category) {
	if (file == null || file.isEmpty())
		return ResponseEntity.badRequest().body(Map.of("error", "No file uploaded"));
	try {
		PdfImportResult result = pdfImportService.importPdf(file, category != null ? category : "DSA");
		SeedBatchResponse saved = seedBatchService.seed(result.batch());
		return ResponseEntity.ok(Map.of(
				"filename",        result.filename(),
				"detectionMethod", result.detectionMethod(),
				"topicCount",      result.topicCount(),
				"created",         saved.getTopicsSeeded(),
				"skipped",         saved.getTopicsSkipped(),
				"errors",          saved.getErrors() != null ? saved.getErrors().size() : 0
		));
	} catch (IOException e) {
		return ResponseEntity.internalServerError()
				.body(Map.of("error", "Failed: " + e.getMessage()));
	}
}
}