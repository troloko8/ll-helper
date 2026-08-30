package com.llhelper.user.controller;

import com.llhelper.user.dto.request.CreateUserRequest;
import com.llhelper.user.dto.request.UpdateUserRequest;
import com.llhelper.user.dto.response.UserResponse;
import com.llhelper.user.service.UserService;
import jakarta.validation.Valid;
import java.security.Principal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(Principal principal) {
        return ResponseEntity.ok(userService.getCurrentUser(principal.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @GetMapping("/username/{username}")
    public ResponseEntity<UserResponse> getUserByUsername(@PathVariable String username) {
        return ResponseEntity.ok(userService.getUserByUsername(username));
    }

    @GetMapping("/auth/{authUserId}")
    public ResponseEntity<UserResponse> getUserByAuthUserId(@PathVariable Long authUserId) {
        return ResponseEntity.ok(userService.getUserByAuthUserId(authUserId));
    }

    @PostMapping
    public ResponseEntity<UserResponse> createUser(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateUserRequest request) {
        return ResponseEntity.ok(userService.createUser(userDetails.getUsername(), request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> updateUser(
        @PathVariable Long id,
        @Valid @RequestBody UpdateUserRequest request
    ) {
        return ResponseEntity.ok(userService.updateUser(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}
