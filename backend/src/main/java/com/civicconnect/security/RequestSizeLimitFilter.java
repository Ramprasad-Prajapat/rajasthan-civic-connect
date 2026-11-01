package com.civicconnect.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Filter enforcing maximum request payload size based on Content-Length header.
 */
@Component
public class RequestSizeLimitFilter extends OncePerRequestFilter {

    private final long maxRequestBytes;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public RequestSizeLimitFilter(@Value("${app.max-request-bytes:41943040}") long maxRequestBytes) {
        this.maxRequestBytes = maxRequestBytes;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        long contentLength = -1;
        String header = request.getHeader("Content-Length");
        if (header != null && !header.isBlank()) {
            try {
                contentLength = Long.parseLong(header.trim());
            } catch (NumberFormatException ignored) {}
        }
        if (contentLength < 0) {
            contentLength = request.getContentLengthLong();
        }

        if (contentLength > maxRequestBytes) {
            response.setStatus(HttpStatus.PAYLOAD_TOO_LARGE.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("success", false);
            body.put("error", "Payload Too Large");
            body.put("message", "Request payload exceeds maximum allowed size of " + maxRequestBytes + " bytes");
            response.getWriter().write(objectMapper.writeValueAsString(body));
            return;
        }

        filterChain.doFilter(request, response);
    }
}
