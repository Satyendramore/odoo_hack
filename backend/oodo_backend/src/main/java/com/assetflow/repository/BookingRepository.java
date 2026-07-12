package com.assetflow.repository;

import com.assetflow.entity.Booking;
import com.assetflow.enums.BookingStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface BookingRepository extends JpaRepository<Booking, UUID> {

    /**
     * Find all overlapping bookings for an asset using pessimistic write lock.
     * 
     * Uses half-open interval logic: two bookings overlap if and only if:
     * startTime1 < endTime2 AND endTime1 > startTime2
     *
     * Examples:
     * - 9:00-10:00 and 10:00-11:00 do NOT overlap (allowed, back-to-back is OK)
     * - 9:00-10:00 and 9:30-10:30 DO overlap (rejected)
     * - 9:30-10:30 and 9:00-10:00 DO overlap (rejected)
     *
     * @param assetId the asset ID
     * @param startTime the start time of the new booking (inclusive)
     * @param endTime the end time of the new booking (exclusive)
     * @return list of overlapping bookings (empty if no conflicts)
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM Booking b WHERE b.asset.id = :assetId " +
           "AND b.status <> 'CANCELLED' " +
           "AND b.startTime < :endTime AND b.endTime > :startTime")
    List<Booking> findOverlapping(
            @Param("assetId") UUID assetId,
            @Param("startTime") Instant startTime,
            @Param("endTime") Instant endTime
    );

    /**
     * Find all bookings for an asset ordered by start time ascending.
     * Used for calendar view.
     *
     * @param assetId the asset ID
     * @return list of bookings ordered by start time
     */
    @Query("SELECT b FROM Booking b WHERE b.asset.id = :assetId AND b.status <> 'CANCELLED' ORDER BY b.startTime ASC")
    List<Booking> findByAssetIdOrderByStartTimeAsc(@Param("assetId") UUID assetId);

    /**
     * Find all bookings made by a user with given status.
     *
     * @param userId the user ID
     * @param status the booking status
     * @return list of bookings matching criteria
     */
    List<Booking> findByBookedByIdAndStatus(UUID userId, BookingStatus status);

    /**
     * Find all bookings with given status that end before a specific time.
     * Useful for scheduled jobs to transition UPCOMING to COMPLETED.
     *
     * @param status the booking status
     * @param time the cutoff time (end time before this)
     * @return list of bookings matching criteria
     */
    List<Booking> findByStatusAndEndTimeBefore(BookingStatus status, Instant time);
}
