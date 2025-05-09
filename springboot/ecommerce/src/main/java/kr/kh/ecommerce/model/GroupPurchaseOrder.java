package kr.kh.ecommerce.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.Instant;

@Entity
@Table(name = "group_purchase_orders", schema = "ecommerce_db")
public class GroupPurchaseOrder {
    @Id
    @Column(name = "id", columnDefinition = "int UNSIGNED not null")
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "group_purchase_id", nullable = false)
    private GroupPurchase groupPurchase;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ColumnDefault("'1'")
    @Column(name = "quantity", columnDefinition = "int UNSIGNED not null")
    private Long quantity;

    @NotNull
    @ColumnDefault("'pending'")
    @Lob
    @Column(name = "status", nullable = false)
    private String status;

    @Size(max = 100)
    @NotNull
    @Column(name = "recipient_name", nullable = false, length = 100)
    private String recipientName;

    @Size(max = 20)
    @NotNull
    @Column(name = "recipient_phone", nullable = false, length = 20)
    private String recipientPhone;

    @Size(max = 255)
    @NotNull
    @Column(name = "recipient_address", nullable = false)
    private String recipientAddress;

    @Size(max = 255)
    @Column(name = "recipient_address_detail")
    private String recipientAddressDetail;

    @Size(max = 20)
    @NotNull
    @Column(name = "recipient_zipcode", nullable = false, length = 20)
    private String recipientZipcode;

    @NotNull
    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "ordered_at", nullable = false)
    private Instant orderedAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public GroupPurchase getGroupPurchase() {
        return groupPurchase;
    }

    public void setGroupPurchase(GroupPurchase groupPurchase) {
        this.groupPurchase = groupPurchase;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Long getQuantity() {
        return quantity;
    }

    public void setQuantity(Long quantity) {
        this.quantity = quantity;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getRecipientName() {
        return recipientName;
    }

    public void setRecipientName(String recipientName) {
        this.recipientName = recipientName;
    }

    public String getRecipientPhone() {
        return recipientPhone;
    }

    public void setRecipientPhone(String recipientPhone) {
        this.recipientPhone = recipientPhone;
    }

    public String getRecipientAddress() {
        return recipientAddress;
    }

    public void setRecipientAddress(String recipientAddress) {
        this.recipientAddress = recipientAddress;
    }

    public String getRecipientAddressDetail() {
        return recipientAddressDetail;
    }

    public void setRecipientAddressDetail(String recipientAddressDetail) {
        this.recipientAddressDetail = recipientAddressDetail;
    }

    public String getRecipientZipcode() {
        return recipientZipcode;
    }

    public void setRecipientZipcode(String recipientZipcode) {
        this.recipientZipcode = recipientZipcode;
    }

    public Instant getOrderedAt() {
        return orderedAt;
    }

    public void setOrderedAt(Instant orderedAt) {
        this.orderedAt = orderedAt;
    }

}