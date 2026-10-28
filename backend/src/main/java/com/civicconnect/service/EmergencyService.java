package com.civicconnect.service;

import com.civicconnect.entity.Emergency;
import com.civicconnect.entity.User;
import com.civicconnect.exception.ApiException;
import com.civicconnect.repository.EmergencyRepository;
import com.civicconnect.util.Constants;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Service managing emergency SOS lifecycle and officer responses.
 */
@Service
public class EmergencyService {

    private final EmergencyRepository emergencyRepository;

    public EmergencyService(EmergencyRepository emergencyRepository) {
        this.emergencyRepository = emergencyRepository;
    }

    @Transactional
    public Emergency createEmergency(Map<String, Object> payload, User caller) {
        Emergency emergency = new Emergency();

        String code = payload.get("emergencyId") != null ? payload.get("emergencyId").toString() :
                "EMG-RAJ-" + Instant.now().getEpochSecond() + "-" + ThreadLocalRandom.current().nextInt(1000, 9999);
        emergency.setEmergencyCode(code);

        emergency.setType(payload.get("type") != null ? payload.get("type").toString() : "Emergency Incident");
        emergency.setDescription(payload.get("description") != null ? payload.get("description").toString() : "");
        emergency.setLocation(payload.get("location") != null ? payload.get("location").toString() : "");

        if (payload.get("lat") != null) {
            emergency.setLatitude(Double.valueOf(payload.get("lat").toString()));
        }
        if (payload.get("lng") != null) {
            emergency.setLongitude(Double.valueOf(payload.get("lng").toString()));
        }

        if (payload.get("reporter") instanceof Map<?, ?> repMap) {
            emergency.setReporterName(repMap.get("name") != null ? repMap.get("name").toString() : "Guest User");
            emergency.setReporterPhone(repMap.get("phone") != null ? repMap.get("phone").toString() : "");
            emergency.setReporterEmail(repMap.get("email") != null ? repMap.get("email").toString() : "");
            emergency.setReporterRole(repMap.get("role") != null ? repMap.get("role").toString() : "Guest");
        } else {
            emergency.setReporterName(payload.get("reporterName") != null ? payload.get("reporterName").toString() :
                    (caller != null ? caller.getName() : "Guest User"));
            emergency.setReporterPhone(payload.get("reporterPhone") != null ? payload.get("reporterPhone").toString() :
                    (caller != null ? caller.getPhone() : ""));
            emergency.setReporterEmail(payload.get("reporterEmail") != null ? payload.get("reporterEmail").toString() :
                    (caller != null ? caller.getEmail() : ""));
            emergency.setReporterRole(caller != null ? caller.getRole() : "Guest");
        }

        if (caller != null) {
            emergency.setUserId(caller.getId());
        }

        if (payload.get("photo") != null) {
            emergency.setPhotoDataUrl(payload.get("photo").toString());
        }

        emergency.setStatus("Reported");
        return emergencyRepository.save(emergency);
    }

    @Transactional(readOnly = true)
    public List<Emergency> getEmergencies(User caller) {
        if (caller != null && Constants.STAFF_ROLES.contains(caller.getRole().toUpperCase())) {
            return emergencyRepository.findAllByOrderByCreatedAtDesc();
        } else if (caller != null) {
            return emergencyRepository.findByUserIdOrderByCreatedAtDesc(caller.getId());
        }
        return emergencyRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional
    public Emergency updateEmergencyStatus(String emergencyId, Map<String, Object> payload, User caller) {
        if (caller != null && !Constants.STAFF_ROLES.contains(caller.getRole().toUpperCase())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only staff can update emergency status");
        }

        Emergency emergency = emergencyRepository.findByEmergencyCode(emergencyId)
                .or(() -> {
                    try {
                        return emergencyRepository.findById(Long.parseLong(emergencyId));
                    } catch (NumberFormatException e) {
                        return java.util.Optional.empty();
                    }
                })
                .orElse(null);

        if (emergency == null) {
            Emergency fallback = new Emergency();
            fallback.setEmergencyCode(emergencyId);
            fallback.setStatus(payload.getOrDefault("status", "Reported").toString());
            fallback.setType("Emergency");
            fallback.setDescription("Emergency incident");
            fallback.setLocation("Jaipur");
            fallback.setReporterName(caller != null ? caller.getName() : "Officer");
            return emergencyRepository.save(fallback);
        }

        if (payload.containsKey("status") && payload.get("status") != null) {
            emergency.setStatus(payload.get("status").toString());
        }
        if (payload.containsKey("officerHandshake") && payload.get("officerHandshake") != null) {
            emergency.setOfficerHandshake(payload.get("officerHandshake").toString());
        }
        if (payload.containsKey("invalidReason") && payload.get("invalidReason") != null) {
            emergency.setInvalidReason(payload.get("invalidReason").toString());
        }
        emergency.setUpdatedAt(Instant.now());
        return emergencyRepository.save(emergency);
    }
}
