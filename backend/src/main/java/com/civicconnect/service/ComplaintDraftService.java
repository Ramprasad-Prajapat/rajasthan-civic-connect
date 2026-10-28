package com.civicconnect.service;

import com.civicconnect.entity.ComplaintDraft;
import com.civicconnect.entity.User;
import com.civicconnect.exception.ApiException;
import com.civicconnect.repository.ComplaintDraftRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
/**
 * Service managing user grievance draft persistence in MySQL.
 */
@Service
public class ComplaintDraftService {

    private final ComplaintDraftRepository complaintDraftRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ComplaintDraftService(ComplaintDraftRepository complaintDraftRepository) {
        this.complaintDraftRepository = complaintDraftRepository;
    }

    @Transactional
    public void saveDraft(Object payload, User caller) {
        if (caller == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Authentication required to save draft");
        }
        try {
            String json = objectMapper.writeValueAsString(payload);
            ComplaintDraft draft = complaintDraftRepository.findByUserId(caller.getId())
                    .orElse(new ComplaintDraft(caller.getId(), json));
            draft.setPayload(json);
            draft.setUpdatedAt(Instant.now());
            complaintDraftRepository.save(draft);
        } catch (Exception e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid draft payload");
        }
    }

    @Transactional(readOnly = true)
    public Object getDraft(User caller) {
        if (caller == null) {
            return null;
        }
        return complaintDraftRepository.findByUserId(caller.getId())
                .map(d -> {
                    try {
                        return objectMapper.readValue(d.getPayload(), Object.class);
                    } catch (Exception e) {
                        return d.getPayload();
                    }
                })
                .orElse(null);
    }

    @Transactional
    public void deleteDraft(User caller) {
        if (caller != null) {
            complaintDraftRepository.deleteByUserId(caller.getId());
        }
    }
}
