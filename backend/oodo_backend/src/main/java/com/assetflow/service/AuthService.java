package com.assetflow.service;

import com.assetflow.dto.AuthResponse;
import com.assetflow.dto.LoginRequest;
import com.assetflow.dto.SignupRequest;
import com.assetflow.entity.User;
import com.assetflow.enums.Role;
import com.assetflow.enums.Status;
import com.assetflow.exception.EmailAlreadyExistsException;
import com.assetflow.exception.InvalidCredentialsException;
import com.assetflow.repository.UserRepository;
import com.assetflow.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;

    @Transactional
    public AuthResponse signup(SignupRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new EmailAlreadyExistsException(
                    "Email already registered: " + request.email()
            );
        }

        User newUser = User.builder()
                .name(request.name())
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .role(Role.EMPLOYEE)
                .status(Status.ACTIVE)
                .build();

        User savedUser = userRepository.save(newUser);
        String token = jwtUtil.generateToken(savedUser);

        log.info("User signed up successfully: {}", savedUser.getEmail());

        return new AuthResponse(
                token,
                savedUser.getId(),
                savedUser.getName(),
                savedUser.getEmail(),
                savedUser.getRole()
        );
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.email(),
                            request.password()
                    )
            );

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            User user = userRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new InvalidCredentialsException("User not found"));

            String token = jwtUtil.generateToken(userDetails);

            log.info("User logged in successfully: {}", user.getEmail());

            return new AuthResponse(
                    token,
                    user.getId(),
                    user.getName(),
                    user.getEmail(),
                    user.getRole()
            );
        } catch (AuthenticationException e) {
            log.warn("Login attempt failed for email: {}", request.email());
            throw new InvalidCredentialsException("Invalid email or password");
        }
    }
}
