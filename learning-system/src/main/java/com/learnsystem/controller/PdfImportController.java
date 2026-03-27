package com.learnsystem.controller;

import com.learnsystem.dto.SeedBatchResponse;
import com.learnsystem.service.PdfImportService;
import com.learnsystem.service.PdfImportService.PdfImportResult;
import com.learnsystem.service.SeedBatchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class PdfImportController {

private final PdfImportService pdfImportService;
private final SeedBatchService seedBatchService;

/**
 * POST /api/admin/import-pdf/preview
 * Upload PDF → returns extracted topics preview (not saved)
 */
@PostMapping(value = "/import-pdf/preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public ResponseEntity<?> preview(
		@RequestPart("file")     MultipartFile file,
		@RequestPart(value="category", required=false) String category) {
	if (file == null || file.isEmpty()) {
		return ResponseEntity.badRequest().body(Map.of("error", "No file uploaded"));
	}
	if (!file.getOriginalFilename().toLowerCase().endsWith(".pdf")) {
		return ResponseEntity.badRequest().body(Map.of("error", "Only PDF files are supported"));
	}
	try {
		PdfImportResult result = pdfImportService.importPdf(file, category != null ? category : "DSA");
		return ResponseEntity.ok(Map.of(
				"filename",       result.filename(),
				"charCount",      result.charCount(),
				"sectionsFound",  result.sectionsFound(),
				"topicsCreated",  result.topicsCreated(),
				"topics",         result.batch().getTopics().stream()
						.map(t -> Map.of(
								"title",    t.getTitle(),
								"category", t.getCategory(),
								"description", t.getDescription() != null ? t.getDescription() : ""
						)).toList()
		));
	} catch (IOException e) {
		return ResponseEntity.internalServerError()
				.body(Map.of("error", "Failed to parse PDF: " + e.getMessage()));
	}
}

/**
 * POST /api/admin/import-pdf/save
 * Upload PDF → extract → save all topics to DB
 */
@PostMapping(value = "/import-pdf/save", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public ResponseEntity<?> saveAll(
		@RequestPart("file")     MultipartFile file,
		@RequestPart(value="category", required=false) String category) {
	if (file == null || file.isEmpty()) {
		return ResponseEntity.badRequest().body(Map.of("error", "No file uploaded"));
	}
	try {
		PdfImportResult result = pdfImportService.importPdf(file, category != null ? category : "DSA");
		SeedBatchResponse saved = seedBatchService.seed(result.batch());
		return ResponseEntity.ok(Map.of(
				"filename",       result.filename(),
				"sectionsFound",  result.sectionsFound(),
				"created",        saved.getTopicsSeeded(),
				"skipped",        saved.getTopicsSkipped(),
				"failed",         saved.getErrors() != null ? saved.getErrors().size() : 0
		));
	} catch (IOException e) {
		return ResponseEntity.internalServerError()
				.body(Map.of("error", "Failed to parse PDF: " + e.getMessage()));
	}
}
}