package com.assetflow.service;

import com.assetflow.dto.BookingRequest;
import com.assetflow.dto.BookingResponse;
import com.assetflow.entity.Asset;
import com.assetflow.entity.Booking;
import com.assetflow.entity.User;
import com.assetflow.enums.BookingStatus;
import com.assetflow.enums.Role;
import com.assetflow.exception.*;
import com.assetflow.repository.AssetRepository;
import com.assetflow.repository.BookingRepository;
import com.assetflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingService {

    private final BookingRepository bookingRepository;
    private final AssetRepository assetRepository;
    private final UserRepository userRepository;

    /**
     * Create a new booking for a bookable asset with overlap detection.
     * Uses pessimistic locking to prevent race conditions during concurrent booking attempts.
     *
     * @param request the booking request
     * @param currentUser the user making the booking
     * @return the created booking as BookingResponse
     * @throws AssetNotFoundException if asset not found
     * @throws AssetNotBookableException if asset has isBookable = false
     * @throws BookingOverlapException if the requested time slot overlaps with existing booking
     */
    @Transactional(isolation = Isolation.SERIALIZABLE)
    public BookingResponse book(BookingRequest request, User currentUser) {
        // Load asset
        Asset asset = assetRepository.findById(request.assetId())
                .orElseThrow(() -> new AssetNotFoundException(
                        "Asset with ID " + request.assetId() + " not found"
                ));

        // Verify asset is bookable
        if (!asset.getIsBookable()) {
            throw new AssetNotBookableException(
                    String.format("Asset %s is not available for booking", asset.getAssetTag())
            );
        }

        // Check for overlapping bookings using pessimistic lock
        List<Booking> overlapping = bookingRepository.findOverlapping(
                asset.getId(),
                request.startTime(),
                request.endTime()
        );

        if (!overlapping.isEmpty()) {
            // Format error message with conflicting slot details
            Booking conflict = overlapping.get(0);
            String errorMessage = String.format(
                    "Requested slot %s-%s overlaps with an existing booking %s-%s",
                    request.startTime(), request.endTime(),
                    conflict.getStartTime(), conflict.getEndTime()
            );
            log.warn("Booking overlap detected: {}", errorMessage);
            throw new BookingOverlapException(errorMessage, conflict.getStartTime(), conflict.getEndTime());
        }

        // Create booking
        Booking booking = Booking.builder()
                .asset(asset)
                .bookedBy(currentUser)
                .startTime(request.startTime())
                .endTime(request.endTime())
                .status(BookingStatus.UPCOMING)
                .purpose(request.purpose())
                .build();

        Booking saved = bookingRepository.save(booking);
        log.info("Booking created: asset {} for user {} ({}-{})",
                asset.getAssetTag(), currentUser.getName(), request.startTime(), request.endTime());
        return mapToResponse(saved);
    }

    /**
     * Cancel an existing booking.
     * Only the person who made the booking, their Department Head, or Asset Manager/Admin can cancel.
     *
     * @param bookingId the booking ID
     * @param currentUser the user requesting the cancellation
     * @return the cancelled booking as BookingResponse
     * @throws BookingNotFoundException if booking not found
     * @throws InvalidBookingStateException if booking is already CANCELLED or COMPLETED
     */
    @Transactional
    public BookingResponse cancel(UUID bookingId, User currentUser) {
        // Load booking
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BookingNotFoundException(
                        "Booking with ID " + bookingId + " not found"
                ));

        // Verify booking can be cancelled (not already cancelled or completed)
        if (booking.getStatus() == BookingStatus.CANCELLED || booking.getStatus() == BookingStatus.COMPLETED) {
            throw new InvalidBookingStateException(
                    String.format("Cannot cancel booking with status %s", booking.getStatus())
            );
        }

        // Enforce authorization: only bookedBy, their dept head, or asset manager/admin
        boolean authorized = booking.getBookedBy().getId().equals(currentUser.getId()) ||
                currentUser.getRole() == Role.ASSET_MANAGER ||
                currentUser.getRole() == Role.ADMIN ||
                (currentUser.getRole() == Role.DEPARTMENT_HEAD && 
                 booking.getBookedBy().getDepartment() != null &&
                 booking.getBookedBy().getDepartment().getId().equals(currentUser.getDepartment().getId()));

        if (!authorized) {
            log.warn("Unauthorized cancellation attempt by {} for booking {}", currentUser.getName(), bookingId);
            throw new IllegalArgumentException("Not authorized to cancel this booking");
        }

        // Cancel the booking
        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancelledAt(Instant.now());
        Booking updated = bookingRepository.save(booking);

        log.info("Booking {} cancelled by {}", bookingId, currentUser.getName());
        return mapToResponse(updated);
    }

    /**
     * Get calendar view of all bookings for an asset.
     *
     * @param assetId the asset ID
     * @return list of non-cancelled bookings ordered by start time
     */
    @Transactional(readOnly = true)
    public List<BookingResponse> getCalendar(UUID assetId) {
        List<Booking> bookings = bookingRepository.findByAssetIdOrderByStartTimeAsc(assetId);
        return bookings.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Reschedule an existing booking to new times.
     * Atomically cancels the old booking and creates a new one with updated times.
     *
     * @param bookingId the booking ID to reschedule
     * @param newRequest the new booking times
     * @param currentUser the user requesting the reschedule
     * @return the new booking as BookingResponse
     * @throws BookingNotFoundException if booking not found
     * @throws InvalidBookingStateException if booking cannot be rescheduled
     * @throws BookingOverlapException if new times overlap with other bookings
     */
    @Transactional(isolation = Isolation.SERIALIZABLE)
    public BookingResponse reschedule(UUID bookingId, BookingRequest newRequest, User currentUser) {
        // Load original booking
        Booking original = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BookingNotFoundException(
                        "Booking with ID " + bookingId + " not found"
                ));

        // Verify it's the same asset
        if (!original.getAsset().getId().equals(newRequest.assetId())) {
            throw new IllegalArgumentException("Cannot change asset during reschedule");
        }

        // Cancel the original booking
        cancel(bookingId, currentUser);

        // Create new booking with updated times
        // Create a new request with the original asset ID to ensure consistency
        BookingRequest createRequest = new BookingRequest(
                original.getAsset().getId(),
                newRequest.startTime(),
                newRequest.endTime(),
                newRequest.purpose()
        );

        BookingResponse newBooking = book(createRequest, currentUser);
        log.info("Booking {} rescheduled by {}: {}-{}", bookingId, currentUser.getName(),
                newRequest.startTime(), newRequest.endTime());
        return newBooking;
    }

    /**
     * Get a specific booking by ID.
     *
     * @param id the booking ID
     * @return the booking as BookingResponse
     * @throws BookingNotFoundException if not found
     */
    @Transactional(readOnly = true)
    public BookingResponse getById(UUID id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new BookingNotFoundException(
                        "Booking with ID " + id + " not found"
                ));
        return mapToResponse(booking);
    }

    /**
     * Get all upcoming bookings for a user.
     *
     * @param userId the user ID
     * @return list of upcoming bookings
     */
    @Transactional(readOnly = true)
    public List<BookingResponse> getUserUpcomingBookings(UUID userId) {
        List<Booking> bookings = bookingRepository.findByBookedByIdAndStatus(userId, BookingStatus.UPCOMING);
        return bookings.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Maps a Booking entity to its DTO representation.
     *
     * @param booking the booking entity
     * @return the booking as BookingResponse
     */
    private BookingResponse mapToResponse(Booking booking) {
        return new BookingResponse(
                booking.getId(),
                booking.getAsset().getId(),
                booking.getAsset().getAssetTag(),
                booking.getBookedBy().getName(),
                booking.getStartTime(),
                booking.getEndTime(),
                booking.getStatus(),
                booking.getPurpose(),
                booking.getCreatedAt()
        );
    }
}
