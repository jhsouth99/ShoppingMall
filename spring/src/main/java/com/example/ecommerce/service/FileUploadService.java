package com.example.ecommerce.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
public class FileUploadService {

    private static final Logger logger = LoggerFactory.getLogger(FileUploadService.class);

    // 허용되는 이미지 파일 확장자
    private static final List<String> ALLOWED_IMAGE_EXTENSIONS =
            Arrays.asList(".jpg", ".jpeg", ".png", ".gif", ".webp");

    // 최대 파일 크기 (5MB)
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024;

    @Value("${file.root.path}")
    private String rootPath;

    /**
     * 파일을 지정된 경로에 저장합니다.
     *
     * @param file 업로드할 파일
     * @param relativePath 기본 경로 기준 상대 경로
     * @param filename 저장할 파일명
     * @return 저장된 파일의 전체 경로
     * @throws IOException 파일 저장 실패 시
     */
    public String saveFile(MultipartFile file, String relativePath, String filename) throws IOException {

        // 파일 유효성 검사
        validateFile(file);

        // 저장 디렉토리 생성 - 수정된 부분
        Path uploadDir = Paths.get(rootPath + relativePath);
        createDirectoryIfNotExists(uploadDir);

        // 파일 저장
        Path filePath = uploadDir.resolve(filename);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        logger.info("파일 저장 완료: {}", filePath.toString());
        return filePath.toString();
    }

    /**
     * 파일을 자동 생성된 파일명으로 저장합니다.
     *
     * @param file 업로드할 파일
     * @param relativePath 기본 경로 기준 상대 경로
     * @return 웹에서 접근 가능한 상대 URL
     * @throws IOException 파일 저장 실패 시
     */
    public String saveFileWithGeneratedName(MultipartFile file, String relativePath) throws IOException {

        String originalFilename = file.getOriginalFilename();
        String extension = getFileExtension(originalFilename);
        String generatedFilename = generateUniqueFilename() + extension;

        saveFile(file, relativePath, generatedFilename);

        // 웹에서 접근 가능한 URL 반환 - 수정된 부분
        return "/uploads" + relativePath + "/" + generatedFilename;
    }

    /**
     * 파일을 삭제합니다.
     *
     * @param fileUrl 삭제할 파일의 URL (웹 경로)
     * @return 삭제 성공 여부
     */
    public boolean deleteFile(String fileUrl) {
        try {
            // URL을 실제 파일 경로로 변환
            String filePath = convertUrlToFilePath(fileUrl);
            Path path = Paths.get(filePath);

            if (Files.exists(path)) {
                Files.delete(path);
                logger.info("파일 삭제 완료: {}", filePath);
                return true;
            } else {
                logger.warn("삭제할 파일이 존재하지 않습니다: {}", filePath);
                return false;
            }
        } catch (IOException e) {
            logger.error("파일 삭제 실패: " + fileUrl, e);
            return false;
        }
    }

    /**
     * 여러 파일을 삭제합니다.
     *
     * @param fileUrls 삭제할 파일들의 URL 목록
     * @return 성공적으로 삭제된 파일 수
     */
    public int deleteFiles(List<String> fileUrls) {
        int deletedCount = 0;
        for (String url : fileUrls) {
            if (deleteFile(url)) {
                deletedCount++;
            }
        }
        return deletedCount;
    }

    /**
     * 파일 유효성 검사
     */
    private void validateFile(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IOException("빈 파일은 업로드할 수 없습니다.");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IOException("파일 크기가 너무 큽니다. 최대 5MB까지 업로드 가능합니다.");
        }

        String filename = file.getOriginalFilename();
        if (filename == null || filename.trim().isEmpty()) {
            throw new IOException("파일명이 유효하지 않습니다.");
        }

        String extension = getFileExtension(filename).toLowerCase();
        if (!ALLOWED_IMAGE_EXTENSIONS.contains(extension)) {
            throw new IOException("지원하지 않는 파일 형식입니다. " +
                    "허용되는 형식: " + String.join(", ", ALLOWED_IMAGE_EXTENSIONS));
        }
    }

    /**
     * 디렉토리가 존재하지 않으면 생성합니다.
     */
    private void createDirectoryIfNotExists(Path directory) throws IOException {
        if (!Files.exists(directory)) {
            Files.createDirectories(directory);
            logger.info("디렉토리 생성: {}", directory.toString());
        }
    }

    /**
     * 파일 확장자를 추출합니다.
     */
    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf("."));
    }

    /**
     * 고유한 파일명을 생성합니다.
     */
    private String generateUniqueFilename() {
        return System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8);
    }

    /**
     * 웹 URL을 실제 파일 시스템 경로로 변환합니다.
     */
    private String convertUrlToFilePath(String url) {
        // "/uploads/images/products/filename.jpg" -> "C:/uploads/images/products/filename.jpg"
        String relativePath = url.startsWith("/uploads/") ? url.substring("/uploads/".length()) : url;
        return Paths.get(rootPath, relativePath).toString();
    }

    /**
     * 파일이 실제로 존재하는지 확인합니다.
     */
    public boolean fileExists(String fileUrl) {
        try {
            String filePath = convertUrlToFilePath(fileUrl);
            return Files.exists(Paths.get(filePath));
        } catch (Exception e) {
            logger.warn("파일 존재 여부 확인 실패: " + fileUrl, e);
            return false;
        }
    }

    /**
     * 파일 크기를 반환합니다.
     */
    public long getFileSize(String fileUrl) {
        try {
            String filePath = convertUrlToFilePath(fileUrl);
            return Files.size(Paths.get(filePath));
        } catch (Exception e) {
            logger.warn("파일 크기 조회 실패: " + fileUrl, e);
            return -1;
        }
    }

    /**
     * 반품/교환 이미지 업로드
     */
    public List<String> uploadAfterSalesImages(List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            return new ArrayList<>();
        }

        List<String> uploadedUrls = new ArrayList<>();
        String relativePath = "/after-sales/" +
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));

        for (MultipartFile file : files) {
            if (file.isEmpty()) {
                continue;
            }

            try {
                // 기존 FileUploadService의 saveFileWithGeneratedName 메서드 사용
                String fileUrl = saveFileWithGeneratedName(file, relativePath);
                uploadedUrls.add(fileUrl);

                logger.info("반품/교환 이미지 업로드 완료: {}", fileUrl);

            } catch (IOException e) {
                logger.error("파일 업로드 중 오류 발생: {}", file.getOriginalFilename(), e);
                throw new RuntimeException("파일 업로드 중 오류가 발생했습니다: " + e.getMessage());
            }
        }

        return uploadedUrls;
    }
}