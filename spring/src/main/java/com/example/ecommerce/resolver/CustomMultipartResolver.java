package com.example.ecommerce.resolver;

import javax.servlet.http.HttpServletRequest;
import org.springframework.web.multipart.commons.CommonsMultipartResolver;

import java.util.List;

public class CustomMultipartResolver extends CommonsMultipartResolver {
    @Override
    public boolean isMultipart(HttpServletRequest request) {
        String method = request.getMethod().toLowerCase();
        // POST, PUT, PATCH 요청도 multipart 처리 허용
        if (!List.of("post", "put", "patch").contains(method)) {
            return false;
        }
        String contentType = request.getContentType();
        return (contentType != null && contentType.toLowerCase().startsWith("multipart/"));
    }
}