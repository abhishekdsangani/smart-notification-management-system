package com.vasyerp.notification.service;

import com.vasyerp.notification.dto.request.NotificationCreateRequest;
import com.vasyerp.notification.dto.response.DashboardResponse;
import com.vasyerp.notification.dto.response.NotificationResponse;
import com.vasyerp.notification.enums.NotificationStatus;
import com.vasyerp.notification.enums.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface NotificationService {

    NotificationResponse create(NotificationCreateRequest request);

    Page<NotificationResponse> list(NotificationStatus status, NotificationType type, Pageable pageable);

    NotificationResponse retry(Long id);

    DashboardResponse dashboard();

}
