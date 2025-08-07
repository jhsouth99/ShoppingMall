package com.example.ecommerce.util;

import org.springframework.web.multipart.MultipartFile;
import java.util.Arrays;
import java.util.List;

public class FileValidationUtil {

    private static final List<String> ALLOWED_CONTENT_TYPES = Arrays.asList(
            "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"
    );

    private static final List<String> DANGEROUS_EXTENSIONS = Arrays.asList(
            ".exe", ".bat", ".cmd", ".scr", ".pif", ".js", ".jar", ".php", ".asp", ".jsp"
    );

    /**
     * 업로드된 파일의 보안 검증
     */
    public static boolean isSecureFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return false;
        }

        // Content-Type 검증
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            return false;
        }

        // 파일 확장자 검증
        String filename = file.getOriginalFilename();
        if (filename == null) {
            return false;
        }

        String extension = getFileExtension(filename).toLowerCase();
        if (DANGEROUS_EXTENSIONS.contains(extension)) {
            return false;
        }

        // 파일명 내 위험한 문자 검증
        if (filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
            return false;
        }

        return true;
    }

    private static String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf("."));
    }
}