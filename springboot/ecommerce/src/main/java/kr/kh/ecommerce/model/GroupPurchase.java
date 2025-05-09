package kr.kh.ecommerce.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.Instant;

@Entity
@Table(name = "group_purchases", schema = "ecommerce_db")
public class GroupPurchase {
    @Id
    @Column(name = "id", columnDefinition = "int UNSIGNED not null")
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "target_qty", columnDefinition = "int UNSIGNED not null")
    private Long targetQty;

    @Column(name = "discounted_price", columnDefinition = "int UNSIGNED not null")
    private Long discountedPrice;

    @ColumnDefault("'0'")
    @Column(name = "current_qty", columnDefinition = "int UNSIGNED not null")
    private Long currentQty;

    @NotNull
    @Column(name = "deadline", nullable = false)
    private Instant deadline;

    @NotNull
    @ColumnDefault("0")
    @Column(name = "is_success", nullable = false)
    private Boolean isSuccess = false;

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

    public Product getProduct() {
        return product;
    }

    public void setProduct(Product product) {
        this.product = product;
    }

    public Long getTargetQty() {
        return targetQty;
    }

    public void setTargetQty(Long targetQty) {
        this.targetQty = targetQty;
    }

    public Long getDiscountedPrice() {
        return discountedPrice;
    }

    public void setDiscountedPrice(Long discountedPrice) {
        this.discountedPrice = discountedPrice;
    }

    public Long getCurrentQty() {
        return currentQty;
    }

    public void setCurrentQty(Long currentQty) {
        this.currentQty = currentQty;
    }

    public Instant getDeadline() {
        return deadline;
    }

    public void setDeadline(Instant deadline) {
        this.deadline = deadline;
    }

    public Boolean getIsSuccess() {
        return isSuccess;
    }

    public void setIsSuccess(Boolean isSuccess) {
        this.isSuccess = isSuccess;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

}