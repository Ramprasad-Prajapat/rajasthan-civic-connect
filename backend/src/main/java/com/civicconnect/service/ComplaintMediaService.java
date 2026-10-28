package com.civicconnect.service;

import com.civicconnect.entity.ComplaintMedia;
import com.civicconnect.repository.ComplaintMediaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * Service managing storage and decoding of grievance photo attachments.
 */
@Service
public class ComplaintMediaService {

    private final ComplaintMediaRepository complaintMediaRepository;

    public ComplaintMediaService(ComplaintMediaRepository complaintMediaRepository) {
        this.complaintMediaRepository = complaintMediaRepository;
    }

    @Transactional
    public void saveMedia(Long complaintId, Object mediaObj, String mediaType) {
        if (mediaObj == null) return;
        List<String> urls = new ArrayList<>();
        if (mediaObj instanceof String s && !s.isBlank()) {
            urls.add(s);
        } else if (mediaObj instanceof List<?> list) {
            for (Object item : list) {
                if (item instanceof String s && !s.isBlank()) {
                    urls.add(s);
                }
            }
        }

        for (String url : urls) {
            byte[] bytes = null;
            String contentType = "image/jpeg";
            if (url.startsWith("data:")) {
                int commaIdx = url.indexOf(',');
                if (commaIdx > 0) {
                    String header = url.substring(5, commaIdx);
                    if (header.contains(";")) {
                        contentType = header.substring(0, header.indexOf(';'));
                    }
                    try {
                        bytes = Base64.getDecoder().decode(url.substring(commaIdx + 1));
                    } catch (IllegalArgumentException e) {
                        // ignore malformed base64
                    }
                }
            }
            long size = bytes != null ? bytes.length : url.length();
            ComplaintMedia media = new ComplaintMedia(complaintId, mediaType, "proof_" + System.currentTimeMillis() + ".jpg", contentType, size, bytes, url);
            complaintMediaRepository.save(media);
        }
    }

    @Transactional(readOnly = true)
    public MediaBundle extractMedia(Long complaintId) {
        List<ComplaintMedia> mediaList = complaintMediaRepository.findByComplaintIdOrderByCreatedAtAsc(complaintId);
        String photo = "";
        List<String> beforePhotos = new ArrayList<>();
        List<String> afterPhotos = new ArrayList<>();

        for (ComplaintMedia m : mediaList) {
            String url = m.getDataUrl();
            if (url == null || url.isBlank()) continue;
            if ("PHOTO_AFTER".equalsIgnoreCase(m.getMediaType())) {
                afterPhotos.add(url);
            } else {
                if (photo.isBlank()) photo = url;
                beforePhotos.add(url);
            }
        }
        return new MediaBundle(photo, beforePhotos, afterPhotos);
    }

    public record MediaBundle(String photo, List<String> beforePhotos, List<String> afterPhotos) {}
}
