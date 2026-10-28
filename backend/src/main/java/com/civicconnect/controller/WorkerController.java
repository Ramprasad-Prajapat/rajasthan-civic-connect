package com.civicconnect.controller;

import com.civicconnect.entity.Worker;
import com.civicconnect.service.WorkerService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * REST controller managing municipal field workers.
 */
@RestController
@RequestMapping({"/api/workers", "/workers"})
public class WorkerController {

    private final WorkerService workerService;

    public WorkerController(WorkerService workerService) {
        this.workerService = workerService;
    }

    @GetMapping
    public ResponseEntity<List<Worker>> getWorkers() {
        return ResponseEntity.ok(workerService.getAllWorkers());
    }

    @PostMapping
    public ResponseEntity<Worker> createWorker(@RequestBody Map<String, Object> body) {
        Worker worker = workerService.createWorker(body);
        return ResponseEntity.ok(worker);
    }

    @GetMapping("/{id}/tasks")
    public ResponseEntity<List<Object>> getWorkerTasks(@PathVariable Long id) {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Worker> updateWorkerStatus(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Worker updated = workerService.updateWorkerStatus(id, body);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/complaints/{complaintId}/upload-proof")
    public ResponseEntity<Map<String, String>> uploadWorkerProof(@PathVariable String complaintId) {
        return ResponseEntity.ok(Map.of("message", "Proof recorded", "afterURL", ""));
    }
}
