package com.civicconnect.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Controller providing simulated AI classification and vision analysis (mock by design, read-only).
 */
@RestController
@RequestMapping({"/api/ai", "/ai"})
public class AiController {

    @PostMapping("/classify")
    public ResponseEntity<Map<String, Object>> aiClassify(@RequestBody(required = false) Map<String, Object> body) {
        String text = body != null && body.get("text") != null ? body.get("text").toString().toLowerCase() : "";
        String category = "General";
        String priority = "Normal";

        if (text.contains("water") || text.contains("leak") || text.contains("pipe")) {
            category = "water";
        } else if (text.contains("electric") || text.contains("light") || text.contains("power")) {
            category = "electrical";
        } else if (text.contains("garbage") || text.contains("waste") || text.contains("clean")) {
            category = "sanitation";
        } else if (text.contains("road") || text.contains("pothole")) {
            category = "road";
        }

        if (text.contains("danger") || text.contains("accident") || text.contains("fire") || text.contains("emergency")) {
            priority = "Critical";
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "category", category,
                "priority", priority,
                "confidence", "92.4%",
                "simulated", true
        ));
    }

    @PostMapping("/analyze-image")
    public ResponseEntity<Map<String, Object>> aiAnalyzeImage(@RequestBody(required = false) Map<String, Object> body) {
        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", Map.of(
                        "detectedIssue", "Civic Infrastructure Anomaly",
                        "severity", "Moderate",
                        "suggestedCategory", "Public Works"
                ),
                "simulated", true
        ));
    }

    @GetMapping("/analytics")
    public ResponseEntity<Map<String, Object>> aiAnalytics() {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("slaComplianceForecast", "94.2%");
        data.put("highRiskWards", List.of("Ward 12", "Ward 08", "Ward 03"));
        data.put("modelConfidence", "91.8%");

        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", data,
                "simulated", true
        ));
    }
}
