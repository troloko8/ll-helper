package com.llhelper.auth.mapper;

import com.llhelper.auth.dto.response.AuthResponse;
import com.llhelper.auth.entity.AuthUser;
import org.springframework.stereotype.Component;

@Component
public class AuthMapper {

    public AuthResponse toResponse(AuthUser authUser) {
        return new AuthResponse("token-for-" + authUser.getId());
    }
}
