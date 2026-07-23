package com.vasyerp.notification.repository;

import com.vasyerp.notification.entity.Notification;
import com.vasyerp.notification.enums.NotificationStatus;
import com.vasyerp.notification.enums.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    @Query("SELECT n FROM Notification n "
            + "WHERE (:status IS NULL OR n.status = :status) "
            + "AND (:type IS NULL OR n.type = :type)")
    Page<Notification> findAllByFilters(@Param("status") NotificationStatus status,
                                        @Param("type") NotificationType type,
                                        Pageable pageable);

    boolean existsByUserIdAndTypeAndMessageAndCreatedAtAfter(Long userId,
                                                             NotificationType type,
                                                             String message,
                                                             LocalDateTime after);

    long countByStatus(NotificationStatus status);

    @Query("SELECT n.type AS type, COUNT(n) AS count FROM Notification n GROUP BY n.type")
    List<TypeCount> countGroupedByType();

    interface TypeCount {
        NotificationType getType();
        Long getCount();
    }

}