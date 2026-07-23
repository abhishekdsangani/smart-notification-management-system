package com.vasyerp.notification.dto.response;

import com.vasyerp.notification.enums.NotificationStatus;
import com.vasyerp.notification.enums.NotificationType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class NotificationResponse {

    private Long id;
    private Long userId;
    private NotificationType type;
    private String message;
    private NotificationStatus status;
    private LocalDateTime scheduleTime;
    private Integer retryCount;
    private LocalDateTime createdAt;
}