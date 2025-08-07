package com.example.ecommerce.dto;

import java.util.List;
import lombok.Getter;
import lombok.ToString;

@Getter
@ToString
public class PageResult<T> {
    private List<T> content;
    private int totalElements;
    private int totalPages; // [신규] 총 페이지 수 필드 추가
    private int page;
    private int size;
    private boolean first;
    private boolean last;

    // 생성자에서 totalPages를 자동으로 계산하도록 변경
    public PageResult(List<T> content, int totalElements, int page, int size) {
        this.content = content;
        this.totalElements = totalElements;
        this.page = page;
        this.size = size;

        // 총 페이지 수 계산
        this.totalPages = (size > 0) ? (int) Math.ceil((double) totalElements / size) : 0;
        
        // 첫 페이지, 마지막 페이지 여부 계산
        this.first = (page == 1);
        this.last = (page >= totalPages);
    }
}