package com.vasyerp.notification.service.impl;

import com.vasyerp.notification.constant.NotificationConstants;
import com.vasyerp.notification.dto.request.NotificationCreateRequest;
import com.vasyerp.notification.dto.response.DashboardResponse;
import com.vasyerp.notification.dto.response.NotificationResponse;
import com.vasyerp.notification.entity.Notification;
import com.vasyerp.notification.enums.NotificationStatus;
import com.vasyerp.notification.enums.NotificationType;
import com.vasyerp.notification.exception.DuplicateNotificationException;
import com.vasyerp.notification.exception.InvalidMessageException;
import com.vasyerp.notification.exception.NotificationNotFoundException;
import com.vasyerp.notification.exception.RetryNotEligibleException;
import com.vasyerp.notification.producer.NotificationProducer;
import com.vasyerp.notification.repository.NotificationRepository;
import com.vasyerp.notification.service.NotificationService;
import com.vasyerp.notification.transformer.NotificationTransformer;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Log4j2
public class NotificationServiceImpl implements NotificationService {

    private static final Pattern WORD_PATTERN = Pattern.compile("\\b\\w+\\b");

    private final NotificationRepository notificationRepository;
    private final NotificationTransformer notificationTransformer;
    private final NotificationProducer notificationProducer;

    @Override
    @Transactional
    public NotificationResponse create(NotificationCreateRequest request) {
        validateMessage(request.getMessage());
        checkDuplicate(request.getUserId(), request.getType(), request.getMessage());

        Notification notification = Notification.builder()
                .userId(request.getUserId())
                .type(request.getType())
                .message(request.getMessage())
                .scheduleTime(request.getScheduleTime())
                .build();

        Notification saved = notificationRepository.save(notification);
        log.info("Created notification {} for user {} ({})", saved.getId(), saved.getUserId(), saved.getType());
        notificationProducer.publish(saved.getId());
        return notificationTransformer.toResponse(saved);
    }

    @Override
    public Page<NotificationResponse> list(NotificationStatus status, NotificationType type, Pageable pageable) {
        return notificationRepository.findAllByFilters(status, type, pageable)
                .map(notificationTransformer::toResponse);
    }

    @Override
    @Transactional
    public NotificationResponse retry(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new NotificationNotFoundException("No notification found with id " + id));

        if (notification.getStatus() != NotificationStatus.FAILED) {
            throw new RetryNotEligibleException("Only notifications with status FAILED can be retried");
        }
        if (notification.getRetryCount() >= NotificationConstants.MAX_RETRY_ATTEMPTS) {
            throw new RetryNotEligibleException("Notification has already reached the maximum of "
                    + NotificationConstants.MAX_RETRY_ATTEMPTS + " retry attempts");
        }
        LocalDateTime lastRetryTime = notification.getLastRetryTime();
        if (lastRetryTime != null
                && lastRetryTime.isAfter(LocalDateTime.now().minusMinutes(NotificationConstants.RETRY_COOLDOWN_MINUTES))) {
            throw new RetryNotEligibleException("Please wait at least "
                    + NotificationConstants.RETRY_COOLDOWN_MINUTES + " minutes between retry attempts");
        }

        notification.setRetryCount(notification.getRetryCount() + 1);
        notification.setLastRetryTime(LocalDateTime.now());
        notification.setStatus(NotificationStatus.RETRYING);

        Notification saved = notificationRepository.save(notification);
        log.info("Retrying notification {} (attempt {})", saved.getId(), saved.getRetryCount());
        notificationProducer.publish(saved.getId());
        return notificationTransformer.toResponse(saved);
    }

    @Override
    public DashboardResponse dashboard() {
        long total = notificationRepository.count();
        long sent = notificationRepository.countByStatus(NotificationStatus.SENT);
        long failed = notificationRepository.countByStatus(NotificationStatus.FAILED);
        long retrying = notificationRepository.countByStatus(NotificationStatus.RETRYING);

        Map<NotificationType, Long> typeWiseStats = notificationRepository.countGroupedByType().stream()
                .collect(Collectors.toMap(NotificationRepository.TypeCount::getType,
                        NotificationRepository.TypeCount::getCount));

        return DashboardResponse.builder()
                .totalNotifications(total)
                .sentCount(sent)
                .failedCount(failed)
                .retryCount(retrying)
                .typeWiseStats(typeWiseStats)
                .build();
    }

    private void validateMessage(String message) {
        Map<String, Integer> wordCounts = new HashMap<>();
        Matcher matcher = WORD_PATTERN.matcher(message.toLowerCase());
        while (matcher.find()) {
            String word = matcher.group();
            int count = wordCounts.merge(word, 1, Integer::sum);
            if (count > NotificationConstants.MAX_WORD_REPETITION) {
                throw new InvalidMessageException("Message contains the word \"" + word
                        + "\" repeated more than " + NotificationConstants.MAX_WORD_REPETITION + " times");
            }
        }
    }

    private void checkDuplicate(Long userId, NotificationType type, String message) {
        LocalDateTime windowStart = LocalDateTime.now().minusMinutes(NotificationConstants.DUPLICATE_WINDOW_MINUTES);
        if (notificationRepository.existsByUserIdAndTypeAndMessageAndCreatedAtAfter(userId, type, message, windowStart)) {
            throw new DuplicateNotificationException(
                    "A notification with the same type and message was already created for this user in the last "
                            + NotificationConstants.DUPLICATE_WINDOW_MINUTES + " minutes");
        }
    }

}
