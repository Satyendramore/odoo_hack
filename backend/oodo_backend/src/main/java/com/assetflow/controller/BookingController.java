package com.assetflow.controller;

import com.assetflow.dto.BookingRequest;
import com.assetflow.dto.BookingResponse;
import com.assetflow.entity.User;
import com.assetflow.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    /**
     * Create a new booking for a bookable asset.
     * Open to any authenticated user.
     *
     * @param request the booking request
     * @param authentication the current user
     * @return the created booking with HTTP 201
     */
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BookingResponse> book(
            @Valid @RequestBody BookingRequest request,
            Authentication authentication
    ) {
        User currentUser = (User) authentication.getPrincipal();
        BookingResponse response = bookingService.book(request, currentUser);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * Get calendar view of all bookings for an asset.
     * Open to any authenticated user.
     *
     * @param assetId the asset ID
     * @return list of bookings ordered by start time
     */
    @GetMapping("/asset/{assetId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<BookingResponse>> getCalendar(@PathVariable UUID assetId) {
        List<BookingResponse> calendar = bookingService.getCalendar(assetId);
        return ResponseEntity.ok(calendar);
    }

    /**
     * Cancel an existing booking.
     * Open to the person who made it, their dept head, or asset manager/admin.
     * Authorization is enforced at service layer.
     *
     * @param id the booking ID
     * @param authentication the current user
     * @return the cancelled booking
     */
    @PatchMapping("/{id}/cancel")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BookingResponse> cancel(
            @PathVariable UUID id,
            Authentication authentication
    ) {
        User currentUser = (User) authentication.getPrincipal();
        BookingResponse response = bookingService.cancel(id, currentUser);
        return ResponseEntity.ok(response);
    }

    /**
     * Reschedule an existing booking to new times.
     * Atomically cancels old and creates new booking.
     * Same authorization as cancel.
     *
     * @param id the booking ID to reschedule
     * @param newRequest the new booking times
     * @param authentication the current user
     * @return the new booking
     */
    @PatchMapping("/{id}/reschedule")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BookingResponse> reschedule(
            @PathVariable UUID id,
            @Valid @RequestBody BookingRequest newRequest,
            Authentication authentication
    ) {
        User currentUser = (User) authentication.getPrincipal();
        BookingResponse response = bookingService.reschedule(id, newRequest, currentUser);
        return ResponseEntity.ok(response);
    }

    /**
     * Get a specific booking by ID.
     * Open to any authenticated user.
     *
     * @param id the booking ID
     * @return the booking
     */
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BookingResponse> getById(@PathVariable UUID id) {
        BookingResponse response = bookingService.getById(id);
        return ResponseEntity.ok(response);
    }

    /**
     * Get all upcoming bookings for the current user.
     * Open to authenticated users.
     *
     * @param authentication the current user
     * @return list of upcoming bookings
     */
    @GetMapping("/my/upcoming")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<BookingResponse>> getMyUpcomingBookings(Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        List<BookingResponse> bookings = bookingService.getUserUpcomingBookings(currentUser.getId());
        return ResponseEntity.ok(bookings);
    }
}
