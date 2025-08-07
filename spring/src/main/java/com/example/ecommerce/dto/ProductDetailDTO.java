package com.example.ecommerce.dto;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class ProductDetailDTO extends ProductSummaryDTO {

	private String description;
	private int sellerId;
	private String detailedContent;
	private Integer categoryId;
	private List<Integer> categoryPath;
	private Integer shippingMethodId;
	private Integer shippingFee;
	private String shippingMethodName;

	// 관련 상품 필드
	int relProId, relProBasePrice, relProFinalPrice, relProDiscountRate;
	String relProName, relProImageUrl, relProAltText;
	String relProGroupBuyIsActive;
	int relProMinGroupBuyPrice;

	// 상품 가격 정보 필드(할인적용가)
	int proBasePrice, proDiscountValue;
	String proDiscountType;
	Integer proDiscountRate, proDiscountFixed;


	@EqualsAndHashCode.Exclude
	private Integer stockQuantity;
	public Integer getStockQuantity() {
		if (stockQuantity == null) {
			int sum = 0;
			if (variants != null) {
				for (ProductVariantDTO variant : variants) {
					sum += variant.getStockQuantity();
				}
			}
			return sum;
		}
		return stockQuantity;
	}

	private List<String> imageUrls = new ArrayList<>();
	private String thumbnailUrl; // 대표 이미지 URL (첫 번째 이미지)
	private List<ProductImageDTO> images = new ArrayList<>();

	// 이미지 순서 정보 추가
	private List<Map<String, Object>> imageOrder = new ArrayList<>();

	private List<ProductOptionDTO> options = new ArrayList<>();
	private List<ProductVariantDTO> variants = new ArrayList<>();
	private List<ProductAttributeValueDTO> attributes;

	private int reviewCount;
	private int qnaCount;

	/**
	 * 상품 ID를 설정할 때, 하위 옵션과 변형 객체에도 ID를 전파하여 데이터 일관성을 유지합니다.
	 * @param id 상품 ID
	 */
	public void setProductId(int id) {
		super.setId(id); // 부모 클래스의 id 설정

		if (this.options != null) {
			for (ProductOptionDTO option : this.options) {
				if (option != null) option.setProductId(id);
			}
		}
		if (this.variants != null) {
			for (ProductVariantDTO variant : this.variants) {
				if (variant != null) variant.setProductId(id);
			}
		}
	}

	/**
	 * 이미지 URL 목록을 설정하고, 첫 번째 이미지를 썸네일로 설정합니다.
	 * @param imageUrls 이미지 URL 목록
	 */
	public void setImageUrls(List<String> imageUrls) {
		this.imageUrls = imageUrls != null ? imageUrls : new ArrayList<>();

		// 첫 번째 이미지를 썸네일로 설정
		if (!this.imageUrls.isEmpty()) {
			this.thumbnailUrl = this.imageUrls.get(0);
			// 부모 클래스의 thumbnailUrl도 설정
			super.setThumbnailUrl(this.thumbnailUrl);
		}
	}

	/**
	 * 단일 이미지 URL을 목록에 추가합니다.
	 * @param imageUrl 추가할 이미지 URL
	 */
	public void addImageUrl(String imageUrl) {
		if (imageUrl != null && !imageUrl.isEmpty()) {
			if (this.imageUrls == null) {
				this.imageUrls = new ArrayList<>();
			}
			this.imageUrls.add(imageUrl);

			// 첫 번째 이미지인 경우 썸네일로 설정
			if (this.imageUrls.size() == 1) {
				this.thumbnailUrl = imageUrl;
				super.setThumbnailUrl(imageUrl);
			}
		}
	}

	/**
	 * 이미지 정보를 설정하고 URL 목록도 함께 업데이트
	 */
	public void setImages(List<ProductImageDTO> images) {
		this.images = images != null ? images : new ArrayList<>();

		// 이미지 URL 목록도 함께 업데이트
		this.imageUrls = this.images.stream()
				.map(ProductImageDTO::getImageUrl)
				.collect(Collectors.toList());

		// 첫 번째 이미지를 썸네일로 설정
		if (!this.images.isEmpty()) {
			this.thumbnailUrl = this.images.get(0).getImageUrl();
			super.setThumbnailUrl(this.thumbnailUrl);
		}
	}

	/**
	 * 이미지 순서 정보를 추가합니다.
	 * @param imageId 이미지 ID
	 * @param order 순서
	 * @param type 이미지 타입
	 * @param isExisting 기존 이미지 여부
	 */
	public void addImageOrder(String imageId, int order, String type, boolean isExisting) {
		if (this.imageOrder == null) {
			this.imageOrder = new ArrayList<>();
		}

		Map<String, Object> orderInfo = new HashMap<>();
		orderInfo.put("id", imageId);
		orderInfo.put("order", order);
		orderInfo.put("type", type);
		orderInfo.put("isExisting", isExisting);

		this.imageOrder.add(orderInfo);
	}

	/**
	 * 모든 이미지 순서 정보를 초기화하고 새로 설정합니다.
	 * @param imageOrderList 이미지 순서 정보 리스트
	 */
	public void setImageOrder(List<Map<String, Object>> imageOrderList) {
		this.imageOrder = imageOrderList != null ? imageOrderList : new ArrayList<>();
	}

	/**
	 * 특정 이미지의 순서 정보를 업데이트합니다.
	 * @param imageId 이미지 ID
	 * @param newOrder 새로운 순서
	 * @param newType 새로운 타입
	 */
	public void updateImageOrder(String imageId, int newOrder, String newType) {
		if (this.imageOrder != null) {
			for (Map<String, Object> orderInfo : this.imageOrder) {
				if (imageId.equals(orderInfo.get("id"))) {
					orderInfo.put("order", newOrder);
					orderInfo.put("type", newType);
					break;
				}
			}
		}
	}

	/**
	 * 이미지 순서 정보에서 특정 이미지를 제거합니다.
	 * @param imageId 제거할 이미지 ID
	 */
	public void removeImageOrder(String imageId) {
		if (this.imageOrder != null) {
			this.imageOrder.removeIf(orderInfo -> imageId.equals(orderInfo.get("id")));
		}
	}

	/**
	 * 이미지 순서 정보를 순서대로 정렬합니다.
	 */
	public void sortImageOrder() {
		if (this.imageOrder != null) {
			this.imageOrder.sort((a, b) -> {
				Integer orderA = (Integer) a.get("order");
				Integer orderB = (Integer) b.get("order");
				return Integer.compare(orderA != null ? orderA : 0, orderB != null ? orderB : 0);
			});
		}
	}

	/**
	 * 이미지 순서 정보의 유효성을 검증합니다.
	 * @return 유효한 경우 true, 그렇지 않으면 false
	 */
	public boolean isImageOrderValid() {
		if (this.imageOrder == null || this.imageOrder.isEmpty()) {
			return true; // 빈 리스트는 유효한 것으로 간주
		}

		// 중복된 순서가 있는지 확인
		long distinctOrderCount = this.imageOrder.stream()
				.map(orderInfo -> (Integer) orderInfo.get("order"))
				.filter(order -> order != null)
				.distinct()
				.count();

		return distinctOrderCount == this.imageOrder.size();
	}
}