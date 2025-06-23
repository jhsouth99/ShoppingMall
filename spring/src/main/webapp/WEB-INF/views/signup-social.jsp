<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>회원가입 완료</title>
<style>
    body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center;
           height: 100vh; margin: 0; background-color: #f4f4f4; }
    .signup-container { background-color: #fff; padding: 30px; border-radius: 8px;
           box-shadow: 0 2px 10px rgba(0,0,0,0.1); width: 400px; }
    .signup-container h2 { text-align: center; margin-bottom: 25px; }
    .signup-container .info { text-align: center; margin-bottom: 20px; color: #555; }
    .form-group { margin-bottom: 20px; }
    .form-group label { display: block; margin-bottom: 8px; font-weight: bold; }
    .form-group input { width: 100%; padding: 10px; border: 1px solid #ddd;
           border-radius: 4px; box-sizing: border-box; }
    .form-group input:read-only,
    .form-group input:disabled { background-color:#e9e9e9; cursor: not-allowed; }
    .form-group .feedback { font-size: 0.9em; margin-top: 5px; }
    .valid { color: green; }
    .invalid { color: red; }
    .username-check { display: flex; gap: 8px; }
    .username-check input { flex: 1; }
    .submit-btn { width: 100%; padding: 12px; background-color: #28a745; color: white;
           border: none; border-radius: 4px; cursor: pointer; font-size: 16px; }
    .submit-btn:disabled { background-color: #aaa; cursor: not-allowed; }
    /* 이메일+버튼 한 줄로 */
    .input-with-btn { display:flex; gap:8px; }
    .input-with-btn input { flex:1; }
    .hidden { display: none; }
</style>
</head>
<body>

<div class="signup-container">
    <h2>소셜 계정으로 가입</h2>
    <p class="info">추가 정보를 입력하시면 가입이 완료됩니다.</p>
    
    <form id="socialSignupForm"
          action="<c:url value='/signup/social-perform'/>"
          method="post"
          onsubmit="return validateForm()">
        <input type="hidden" name="${_csrf.parameterName}" value="${_csrf.token}"/>

        <div class="form-group">
            <label for="name">이름 (소셜 계정 정보)</label>
            <input type="text" id="name" name="name" value="${name}" readonly>
            <div id="nameFeedback" class="feedback"></div>
        </div>
        
        <!-- 아이디 입력 + 중복확인 버튼 -->
        <div class="form-group">
            <label for="username">사용할 아이디</label>
            <div class="username-check">
                <input type="text" id="username" name="username" value="${ username }" required>
                <button type="button" id="checkUsernameBtn">중복확인</button>
            </div>
            <div id="usernameFeedback" class="feedback"></div>
        </div>

        <!-- 비밀번호 입력 및 확인 -->
        <div class="form-group">
            <label for="password">비밀번호</label>
            <input type="password" id="password" name="password" required>
        </div>
        <div class="form-group">
            <label for="passwordConfirm">비밀번호 확인</label>
            <input type="password" id="passwordConfirm" name="passwordConfirm" required>
            <div id="passwordFeedback" class="feedback"></div>
        </div>
        
        <div class="form-group">
            <label for="phone">휴대전화번호</label>
            <input type="text" id="phone" name="phone" required>
            <div id="phoneFeedback" class="feedback"></div>
        </div>
        
        <div class="form-group">
            <label for="email">이메일</label>
            <div class="input-with-btn">
                <input type="email" id="email" name="email" value="${email}" required placeholder="이메일 주소를 입력하세요">
                <button type="button" id="checkEmailBtn">중복확인</button>
                <button type="button" id="sendMailBtn">인증번호 받기</button>
            </div>
            <div id="emailFeedback" class="feedback"></div>
        </div>
        <div class="form-group">
            <label for="emailCode">이메일 인증코드</label>
            <div class="input-with-btn">
                <input type="text" id="emailCode" required placeholder="인증코드 6자리">
                <button type="button" id="checkMailBtn">인증 확인</button>
            </div>
            <div id="emailCheckFeedback" class="feedback"></div>
        </div>
        
        <button type="submit" id="submitBtn" class="submit-btn" disabled>가입 완료하기</button>
    </form>
</div>

<script>
window.onload = function() {

    // 요소 가져오기
    const apiUrl        = '<c:url value="/username-exists"/>';
    const nameInput     = document.getElementById('name');
    const nameFeedback  = document.getElementById('nameFeedback');
    const usernameInput = document.getElementById('username');
    const checkBtn      = document.getElementById('checkUsernameBtn');
    const userFeed      = document.getElementById('usernameFeedback');
    const pwdInput      = document.getElementById('password');
    const pwdConfirm    = document.getElementById('passwordConfirm');
    const pwdFeed       = document.getElementById('passwordFeedback');
    const phoneInput    = document.getElementById('phone');
    const phoneFeedback = document.getElementById('phoneFeedback');
    const emailInput    = document.getElementById('email');
    const sendMailBtn   = document.getElementById('sendMailBtn');
    const emailFeedback = document.getElementById('emailFeedback');
    const emailCodeInput = document.getElementById('emailCode');
    const checkMailBtn  = document.getElementById('checkMailBtn');
    const emailCheckFeedback = document.getElementById('emailCheckFeedback');
    
    const submitBtn     = document.getElementById('submitBtn');
    const form = document.getElementById('socialSignupForm');

    let nameValid = true;
    let phoneValid = false;
    let usernameValid = false;
    let passwordMatch = false;
    let emailVerified = false;
    let emailAvailable = false;
    
    const csrfParameterName = "${_csrf.parameterName}";
    const csrfToken = "${_csrf.token}";
    
    const socialEmail = "${email}" || "";

    // --- 사용자가 이름을 수정할 때마다 다시 체크 ---
    nameInput.addEventListener('keyup', function() {
    	const name = nameInput.value;
    	if (name) {
    		nameValid = true;
    		nameFeedback.textContent = "";
    		nameFeedback.className = "feedback";
    	} else {
    		nameValid = false;
    		nameFeedback.textContent = "이름을 입력하세요.";
    		nameFeedback.className = "feedback invalid";
    	}
    	toggleSubmit();
    });

    // --- 사용자가 휴대전화번호를 수정할 때마다 다시 체크 ---
    phoneInput.addEventListener('keyup', function() {
    	const phone = phoneInput.value;
    	if (phone) {
    		phoneValid = true;
    		phoneFeedback.textContent = "";
    		phoneFeedback.className = "feedback";
    	} else {
    		phoneValid = false;
    		phoneFeedback.textContent = "휴대전화번호를 입력하세요.";
    		phoneFeedback.className = "feedback invalid";
    	}
    	toggleSubmit();
    });

    // --- 이메일 인증 UI 활성/비활성 토글 함수 ---
    function updateEmailVerificationUI() {
        const currentEmail = emailInput.value.trim();

        if (!socialEmail || currentEmail !== socialEmail) {
            // 소셜이 비어있거나, 사용자가 이메일을 수정했다면 → 인증 필요
            sendMailBtn.disabled    = true;
            emailCodeInput.disabled = true;
            checkMailBtn.disabled   = true;
            emailAvailable          = false;  // 중복검사 다시 해야 함
            emailVerified           = false;  // 인증도 다시
            emailCodeInput.value    = '';
            emailFeedback.textContent      = '중복 확인을 눌러주세요.';
            emailCheckFeedback.textContent = '';
            emailFeedback.className        = 'feedback';
            emailCheckFeedback.className   = 'feedback';
        } else {
            // 소셜 이메일 그대로라면 → 인증 스킵
            sendMailBtn.disabled    = true;
            emailCodeInput.disabled = true;
            checkMailBtn.disabled   = true;
            emailVerified           = true;
            emailFeedback.textContent      = '소셜 계정 이메일입니다.';
            if (!emailAvailable) {
            	emailFeedback.textContent += ' 중복 확인을 눌러주세요.'
            }
            emailFeedback.className        = 'feedback valid';
            emailCheckFeedback.textContent = '';
        }
        toggleSubmit();
    }

    // --- 초기 상태 설정 ---
    updateEmailVerificationUI();

    // --- 사용자가 이메일을 수정할 때마다 다시 체크 ---
    emailInput.addEventListener('input', updateEmailVerificationUI);

    // ————— 이메일 중복확인 버튼 로직 —————
    checkEmailBtn.addEventListener('click', () => {
        const email = emailInput.value.trim();
        if (!email) {
            emailAvailable = false;
            emailFeedback.textContent   = '이메일을 입력해주세요.';
            emailFeedback.className     = 'feedback invalid';
            toggleSubmit();
            return;
        }
        fetch('<c:url value="/email-exists"/>' + '?email=' + encodeURIComponent(email))
            .then(res => res.json())
            .then(data => {
                if (data.exists) {
                    emailAvailable = false;
                    emailFeedback.textContent   = '이미 사용 중인 이메일입니다.';
                    emailFeedback.className     = 'feedback invalid';
                } else {
                    if (email !== socialEmail) {
                    	sendMailBtn.disabled = false;
                    }
                	emailAvailable = true;
                    emailFeedback.textContent   = '사용 가능한 이메일입니다.';
                    emailFeedback.className     = 'feedback valid';
                }
                toggleSubmit();
            })
            .catch(err => {
                console.error(err);
                // 네트워크 오류 등
                emailAvailable = false;
                emailFeedback.textContent   = '중복 확인 중 오류가 발생했습니다.';
                emailFeedback.className     = 'feedback invalid';
                toggleSubmit();
            });
    });

    // 인증번호 받기 버튼
    sendMailBtn.addEventListener('click', function() {
        const email = emailInput.value.trim();
        if (!email) {
            emailFeedback.textContent = '이메일을 입력해주세요.';
            emailFeedback.className = 'feedback invalid';
            return;
        }
        emailFeedback.textContent = '인증 메일을 보내는 중입니다...';
        emailFeedback.className = 'feedback';

        const formData = new URLSearchParams();
        formData.append('email', email);
        formData.append(csrfParameterName, csrfToken);

        fetch('<c:url value="/mail-send"/>', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            emailCodeInput.disabled = false;
            checkMailBtn.disabled   = false;
            emailFeedback.textContent = data.success ? '인증 메일이 전송되었습니다.' : data.message;
            emailFeedback.className = data.success ? 'feedback valid' : 'feedback invalid';
        })
        .catch(error => {
            console.error('Error:', error);
            alert('메일 전송 중 오류가 발생했습니다.');
        });
    });
    
    // 인증확인 버튼
    checkMailBtn.addEventListener('click', function() {
        const code = emailCodeInput.value.trim();
        if (!code) {
            alert('인증 코드를 입력해주세요.');
            return;
        }
        
        const formData = new URLSearchParams();
        formData.append('code', code);
        formData.append(csrfParameterName, csrfToken);
        
        fetch('<c:url value="/mail-check"/>', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            emailVerified = data.success; // 인증 성공 여부를 상태 변수에 저장
            emailCheckFeedback.textContent = data.message;
            if (data.success) {
            	emailCheckFeedback.className = 'feedback valid';
                sendMailBtn.disabled    = true;
                emailCodeInput.disabled = true;
                checkMailBtn.disabled   = true;
                emailFeedback.textContent = '';
            } else {
            	emailCheckFeedback.className = 'feedback invalid';
            }
            toggleSubmit(); // 제출 버튼 상태 갱신
        })
        .catch(error => {
            console.error('Error:', error);
            alert('인증 확인 중 오류가 발생했습니다.');
        });
    });
    
    // 아이디 중복 검사
    checkBtn.addEventListener('click', () => {
        const user = usernameInput.value.trim();
        if (!user) {
            usernameValid = false;
            userFeed.textContent = '아이디를 입력해주세요.';
            userFeed.className = 'feedback invalid';
            toggleSubmit();
            return;
        }
        fetch(apiUrl + '?username=' + encodeURIComponent(user))
            .then(res => res.json())
            .then(data => {
                if (data.exists) {
                    usernameValid = false;
                    userFeed.textContent = '이미 사용중인 아이디입니다.';
                    userFeed.className = 'feedback invalid';
                } else {
                    usernameValid = true;
                    userFeed.textContent = '사용 가능한 아이디입니다.';
                    userFeed.className = 'feedback valid';
                }
                toggleSubmit();
            })
            .catch(err => console.error(err));
    });

    // 비밀번호 일치 검사
    function checkPasswordMatch() {
        const pw = pwdInput.value, cpw = pwdConfirm.value;
        if (pw && cpw) {
            if (pw === cpw) {
                passwordMatch = true;
                pwdFeed.textContent = '비밀번호가 일치합니다.';
                pwdFeed.className = 'feedback valid';
            } else {
                passwordMatch = false;
                pwdFeed.textContent = '비밀번호가 일치하지 않습니다.';
                pwdFeed.className = 'feedback invalid';
            }
        } else {
            passwordMatch = false;
            pwdFeed.textContent = '';
        }
        toggleSubmit();
    }
    pwdInput.addEventListener('keyup', checkPasswordMatch);
    pwdConfirm.addEventListener('keyup', checkPasswordMatch);

    // 제출 버튼 활성화 제어
    function toggleSubmit() {
    	submitBtn.disabled = !(nameValid && usernameValid && passwordMatch && phoneValid && emailAvailable && emailVerified);
    }

    // 최종 폼 제출 전 검사
    window.validateForm = function() {
        if (!nameValid) {
            alert('이름을 확인해주세요.');
            return false;
        }
        if (!usernameValid) {
            alert('아이디 중복 확인을 해주세요.');
            return false;
        }
        if (!passwordMatch) {
            alert('비밀번호를 확인해주세요.');
            return false;
        }
        if (!phoneValid) {
        	alert('휴대전화번호를 확인해주세요.');
        	return false;
        }
        if (!emailVerified) {
			alert('이메일 인증을 완료해주세요.');
			return false;
        }
        return true;
    };
    
    form.addEventListener('submit', function(event) {
        event.preventDefault(); // 기본 폼 제출(새로고침)을 막습니다.

        const formData = new FormData(form);
        const urlEncodedData = new URLSearchParams(formData).toString();

        fetch(form.action, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: urlEncodedData
        })
        .then(response => response.json()) // 응답을 JSON으로 파싱
        .then(data => {
            alert(data.message); // 서버가 보낸 메시지를 알림창으로 표시
            if (data.success) {
                // 성공 시 메인 페이지로 이동
                window.location.href = '<c:url value="/"/>';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('요청 처리 중 오류가 발생했습니다.');
        });
    });
};
</script>

</body>
</html>
