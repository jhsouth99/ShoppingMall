package kr.kh.ecommerce.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.hibernate.annotations.ColumnDefault;

import java.time.Instant;

@Entity
@Table(name = "products", schema = "ecommerce_db")
public class Product {
    @Id
    @Column(name = "id", columnDefinition = "int UNSIGNED not null")
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "seller_id", nullable = false)
    private Seller seller;

    @Size(max = 100)
    @NotNull
    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Lob
    @Column(name = "description")
    private String description;

    @Column(name = "price", columnDefinition = "int UNSIGNED not null")
    private Long price;

    @ColumnDefault("'0'")
    @Column(name = "discount", columnDefinition = "tinyint UNSIGNED")
    private Short discount;

    @ColumnDefault("'0'")
    @Column(name = "stock", columnDefinition = "int UNSIGNED not null")
    private Long stock;

    @ColumnDefault("'1'")
    @Column(name = "min_order_qty", columnDefinition = "int UNSIGNED not null")
    private Long minOrderQty;

    @ColumnDefault("0")
    @Column(name = "isGroup")
    private Boolean isGroup;

    @ColumnDefault("0")
    @Column(name = "isHot")
    private Boolean isHot;

    @NotNull
    @ColumnDefault("0")
    @Column(name = "is_business_only", nullable = false)
    private Boolean isBusinessOnly = false;

    @ColumnDefault("'0'")
    @Column(name = "sold_count", columnDefinition = "int UNSIGNED not null")
    private Long soldCount;

    @ColumnDefault("'0'")
    @Column(name = "view_count", columnDefinition = "int UNSIGNED not null")
    private Long viewCount;

    @ColumnDefault("'0'")
    @Column(name = "shipping_fee", columnDefinition = "int UNSIGNED not null")
    private Long shippingFee;

    @NotNull
    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Seller getSeller() {
        return seller;
    }

    public void setSeller(Seller seller) {
        this.seller = seller;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Long getPrice() {
        return price;
    }

    public void setPrice(Long price) {
        this.price = price;
    }

    public Short getDiscount() {
        return discount;
    }

    public void setDiscount(Short discount) {
        this.discount = discount;
    }

    public Long getStock() {
        return stock;
    }

    public void setStock(Long stock) {
        this.stock = stock;
    }

    public Long getMinOrderQty() {
        return minOrderQty;
    }

    public void setMinOrderQty(Long minOrderQty) {
        this.minOrderQty = minOrderQty;
    }

    public Boolean getIsGroup() {
        return isGroup;
    }

    public void setIsGroup(Boolean isGroup) {
        this.isGroup = isGroup;
    }

    public Boolean getIsHot() {
        return isHot;
    }

    public void setIsHot(Boolean isHot) {
        this.isHot = isHot;
    }

    public Boolean getIsBusinessOnly() {
        return isBusinessOnly;
    }

    public void setIsBusinessOnly(Boolean isBusinessOnly) {
        this.isBusinessOnly = isBusinessOnly;
    }

    public Long getSoldCount() {
        return soldCount;
    }

    public void setSoldCount(Long soldCount) {
        this.soldCount = soldCount;
    }

    public Long getViewCount() {
        return viewCount;
    }

    public void setViewCount(Long viewCount) {
        this.viewCount = viewCount;
    }

    public Long getShippingFee() {
        return shippingFee;
    }

    public void setShippingFee(Long shippingFee) {
        this.shippingFee = shippingFee;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

}