package com.example.ecommerce.vo;

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
public class UserVO implements UserDetails, OAuth2User {

	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;

	@Getter @Setter
	int id;

	@Getter @Setter
	String username, password, name, phone, email, reset_token, suspension, termination;

	@Getter @Setter
	Date reset_token_expires_at, deleted_at, suspended_at, resumed_at, terminated_at, created_at;
	
	// UserRoleDAO에서 가져온 권한 목록을 저장할 필드
    private Set<String> roles; // DB에서 가져온 String 형태의 Role 이름들
    private Collection<? extends GrantedAuthority> authorities; // GrantedAuthority 타입으로 변환된 권한들
	
	@Override
	public boolean isEnabled() {
		return deleted_at == null;
	}

	@Override
	public boolean isAccountNonExpired() {
		return deleted_at == null;
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

    // DB에서 가져온 Role 목록을 설정하는 메서드 (UserDetailsService에서 호출)
    public void setRoles(Set<String> roles) {
        this.roles = roles;
        // String 형태의 Role을 Spring Security의 GrantedAuthority로 변환
        List<GrantedAuthority> grantedAuthorities = new ArrayList<>();
        if (roles != null) {
            for (String role : roles) {
                grantedAuthorities.add(new SimpleGrantedAuthority("ROLE_" + role));
            }
        }
        this.authorities = grantedAuthorities;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
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
