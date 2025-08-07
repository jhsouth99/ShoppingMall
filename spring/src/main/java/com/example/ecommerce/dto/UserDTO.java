package com.example.ecommerce.dto;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.core.user.OAuth2User;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@AllArgsConstructor
@NoArgsConstructor
@ToString
public class UserDTO implements UserDetails, OAuth2User, Serializable {

	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;

	@Getter @Setter
	int id;

	@Getter @Setter
	String username, password, name, phone, email, resetToken, suspension, termination;

	@Getter @Setter
	Date resetTokenExpiresAt, deletedAt, suspendedAt, resumedAt, terminatedAt, createdAt;
	
	// UserRoleDAO에서 가져온 권한 목록을 저장할 필드
	@Getter @Setter
    private Set<String> roles; // DB에서 가져온 String 형태의 Role 이름들
	private transient Collection<? extends GrantedAuthority> authorities; // GrantedAuthority 타입으로 변환된 권한들
	
	@Override
	public boolean isEnabled() {
		return deletedAt == null;
	}

	@Override
	public boolean isAccountNonExpired() {
		return deletedAt == null;
	}

	@Override
	public boolean isAccountNonLocked() {
		return suspension == null && termination == null;
	}

	@Override
	public boolean isCredentialsNonExpired() {
		// TODO Auto-generated method stub
		return true;
	}
	
	@Override
	public Collection<? extends GrantedAuthority> getAuthorities() {
	    // authorities가 아직 계산되지 않았다면, roles를 기반으로 계산합니다. (Lazy Loading)
	    if (this.authorities == null) {
	        List<GrantedAuthority> grantedAuthorities = new ArrayList<>();
	        if (roles != null) {
	            for (String role : roles) {
	                grantedAuthorities.add(new SimpleGrantedAuthority("ROLE_" + role));
	            }
	        }
	        this.authorities = grantedAuthorities;
	    }
	    return authorities;
	}
    Map<String, Object> attributes;
    
	@Override
	public Map<String, Object> getAttributes() {
		// TODO Auto-generated method stub
		return null;
	}

	public void setAttributes(Map<String, Object> attributes) {
		this.attributes = attributes;
	}
	
	// OAuth2로 로그인한 경우 저장
	@Getter @Setter
	String provider;

}
