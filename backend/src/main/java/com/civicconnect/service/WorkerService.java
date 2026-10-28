package com.civicconnect.service;

import com.civicconnect.entity.Worker;
import com.civicconnect.repository.WorkerRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * Service managing field worker roster and task counts.
 */
@Service
public class WorkerService {

    private final WorkerRepository workerRepository;

    public WorkerService(WorkerRepository workerRepository) {
        this.workerRepository = workerRepository;
    }

    @PostConstruct
    @Transactional
    public void seedDefaultWorkers() {
        if (workerRepository.count() == 0) {
            List<Worker> defaults = List.of(
                    new Worker("Ramesh Meena", "9829012345", "sanitation", "Sanitation Department"),
                    new Worker("Suresh Gurjar", "9829054321", "electrical", "Electrical Department"),
                    new Worker("Kishan Lal", "9829098765", "water", "Water Department"),
                    new Worker("Mohan Singh", "9829067890", "pworks", "Public Works Department")
            );
            workerRepository.saveAll(defaults);
        }
    }

    @Transactional(readOnly = true)
    public List<Worker> getAllWorkers() {
        return workerRepository.findAll();
    }

    @Transactional
    public Worker createWorker(Map<String, Object> payload) {
        String name = payload.get("name") != null && !payload.get("name").toString().isBlank() ?
                payload.get("name").toString().trim() : "Field Worker " + System.currentTimeMillis();

        String phone = payload.get("phone") != null ? payload.get("phone").toString() : "9829000000";
        String deptId = payload.get("departmentId") != null ? payload.get("departmentId").toString() : "sanitation";
        String deptName = payload.get("departmentName") != null ? payload.get("departmentName").toString() : "Sanitation Department";

        Worker worker = new Worker(name, phone, deptId, deptName);
        return workerRepository.save(worker);
    }

    @Transactional
    public Worker updateWorkerStatus(Long id, Map<String, Object> payload) {
        Worker worker = workerRepository.findById(id)
                .orElseGet(() -> {
                    Worker w = new Worker("Worker " + id, "9829000000", "sanitation", "Sanitation Department");
                    return workerRepository.save(w);
                });

        if (payload.containsKey("status") && payload.get("status") != null) {
            worker.setStatus(payload.get("status").toString());
        }
        worker.setUpdatedAt(Instant.now());
        return workerRepository.save(worker);
    }
}
