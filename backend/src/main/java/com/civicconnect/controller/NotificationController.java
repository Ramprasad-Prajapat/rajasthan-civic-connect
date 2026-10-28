package com.civicconnect.controller;

import com.civicconnect.entity.Notification;
import com.civicconnect.entity.User;
import com.civicconnect.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller managing notifications.
 */
@RestController
@RequestMapping({"/api/notifications", "/notifications"})
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<List<Notification>> getNotifications(@AuthenticationPrincipal User caller) {
        return ResponseEntity.ok(notificationService.getNotificationsForUser(caller));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Map<String, String>> markNotificationRead(
            @PathVariable Long id,
            @AuthenticationPrincipal User caller
    ) {
        notificationService.markAsRead(id, caller);
        return ResponseEntity.ok(Map.of("message", "Notification marked as read"));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createNotification(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal User caller
    ) {
        Long targetUserId = body.get("userId") instanceof Number num ? num.longValue() : (caller != null ? caller.getId() : 1L);
        String title = body.get("title") != null ? body.get("title").toString() : "Notification";
        String message = body.get("message") != null ? body.get("message").toString() : "";
        String type = body.get("type") != null ? body.get("type").toString() : "GENERAL";
        String complaintId = body.get("complaintId") != null ? body.get("complaintId").toString() : null;

        Notification notif = notificationService.createNotification(targetUserId, title, message, type, complaintId);
        return ResponseEntity.ok(Map.of("message", "Notification created", "id", notif.getId()));
    }
}
