package com.civicconnect.entity;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Stores complaint attachments and photo proofs.
 */
@Entity
@Table(name = "complaint_media", indexes = {
        @Index(name = "idx_media_complaint_id", columnList = "complaint_id")
})
public class ComplaintMedia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "complaint_id", nullable = false)
    private Long complaintId;

    @Column(name = "media_type", nullable = false, length = 32)
    private String mediaType; // BEFORE, AFTER

    @Column(name = "file_name")
    private String fileName;

    @Column(name = "content_type", length = 64)
    private String contentType;

    @Column(name = "size_bytes")
    private Long sizeBytes;

    @Lob
    @Column(name = "data", columnDefinition = "MEDIUMBLOB")
    private byte[] data;

    @Column(name = "data_url", columnDefinition = "LONGTEXT")
    private String dataUrl;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public ComplaintMedia() {}

    public ComplaintMedia(Long complaintId, String mediaType, String fileName, String contentType, Long sizeBytes, byte[] data, String dataUrl) {
        this.complaintId = complaintId;
        this.mediaType = mediaType;
        this.fileName = fileName;
        this.contentType = contentType;
        this.sizeBytes = sizeBytes;
        this.data = data;
        this.dataUrl = dataUrl;
        this.createdAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getComplaintId() { return complaintId; }
    public void setComplaintId(Long complaintId) { this.complaintId = complaintId; }

    public String getMediaType() { return mediaType; }
    public void setMediaType(String mediaType) { this.mediaType = mediaType; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }

    public Long getSizeBytes() { return sizeBytes; }
    public void setSizeBytes(Long sizeBytes) { this.sizeBytes = sizeBytes; }

    public byte[] getData() { return data; }
    public void setData(byte[] data) { this.data = data; }

    public String getDataUrl() { return dataUrl; }
    public void setDataUrl(String dataUrl) { this.dataUrl = dataUrl; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
