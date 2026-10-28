package com.civicconnect.service;

import com.civicconnect.entity.Notification;
import com.civicconnect.entity.User;
import com.civicconnect.exception.ApiException;
import com.civicconnect.repository.NotificationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service managing user notifications and read state updates.
 */
@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Transactional
    public Notification createNotification(Long userId, String title, String message, String type, String complaintId) {
        Notification notif = new Notification(userId, title, message, type, complaintId);
        return notificationRepository.save(notif);
    }

    @Transactional(readOnly = true)
    public List<Notification> getNotificationsForUser(User caller) {
        if (caller == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(caller.getId());
    }

    @Transactional
    public void markAsRead(Long notificationId, User caller) {
        if (caller == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        notificationRepository.findById(notificationId).ifPresent(notif -> {
            notif.setIsRead(true);
            notificationRepository.save(notif);
        });
    }
}
