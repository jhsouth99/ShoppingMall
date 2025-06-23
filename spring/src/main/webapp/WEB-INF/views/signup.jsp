<%@ page language="java" contentType="text/html; charset=UTF-8"
         pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>회원가입</title>
<style>
    body { font-family: Arial, sans-serif; display: flex;
           justify-content: center; align-items: center;
           height: 100vh; margin: 0; background-color: #f4f4f4; }
    .signup-container { background:#fff; padding:30px;
           border-radius:8px; box-shadow:0 2px 10px rgba(0,0,0,0.1);
           width:400px; }
    .signup-container h2 { text-align:center; margin-bottom:25px; }
    .form-group { margin-bottom:20px; }
    .form-group label { display:block; margin-bottom:8px;
           font-weight:bold; }
    .form-group input { width:100%; padding:10px;
           border:1px solid #ddd; border-radius:4px;
           box-sizing:border-box; }
    .form-group .feedback { font-size:0.9em; margin-top:5px; }
    .valid { color: green; }
    .invalid { color: red; }
    .submit-btn { width:100%; padding:12px;
           background-color:#007bff; color:white; border:none;
           border-radius:4px; cursor:pointer; font-size:16px; }
    .submit-btn:disabled { background-color:#aaa;
           cursor:not-allowed; }
    .form-group input:read-only,
    .form-group input:disabled { background-color:#e9e9e9; cursor: not-allowed; }
    /* 아이디+버튼 한 줄로 */
    .username-check { display:flex; gap:8px; }
    .username-check input { flex:1; }
    /* 이메일+버튼 한 줄로 */
    .email-send { display:flex; gap:8px; }
    .email-send input { flex:1; }
    .email-check { display:flex; gap:8px; }
    .email-check input { flex:1; }
</style>
</head>
<body>

<div class="signup-container">
    <h2>회원가입</h2>
    <form id="signupForm"
          action="<c:url value='/signup-perform'/>"
          method="post"
          onsubmit="return validateForm()">
        <input type="hidden"
               name="${_csrf.parameterName}"
               value="${_csrf.token}"/>

        <!-- 아이디 입력 + 중복확인 버튼 -->
        <div class="form-group">
            <label for="username">아이디</label>
            <div class="username-check">
                <input type="text" id="username" name="username" required>
                <button type="button" id="checkUsernameBtn">중복확인</button>
            </div>
            <div id="usernameFeedback" class="feedback"></div>
        </div>

        <div class="form-group">
            <label for="password">비밀번호</label>
            <input type="password" id="password" name="password" required>
        </div>
        <div class="form-group">
            <label for="passwordConfirm">비밀번호 확인</label>
            <input type="password" id="passwordConfirm"
                   name="passwordConfirm" required>
            <div id="passwordFeedback" class="feedback"></div>
        </div>

        <div class="form-group">
            <label for="name">이름</label>
            <input type="text" id="name" name="name" required>
            <div id="nameFeedback" class="feedback"></div>
        </div>
        <div class="form-group">
            <label for="phone">휴대전화번호</label>
            <input type="text" id="phone" name="phone" required>
            <div id="phoneFeedback" class="feedback"></div>
        </div>
        <div class="form-group">
            <label for="email">이메일</label>
            <div class="email-send">
            	<input type="email" id="email" name="email" required placeholder="이메일 주소를 입력하세요">
            	<button type="button" id="checkEmailBtn">중복확인</button>
                <button type="button" id="sendMailBtn">인증번호 받기</button>
            </div>
            <div id="emailFeedback" class="feedback"></div>
        </div>
        <div class="form-group">
            <label for="emailCode">이메일 인증코드</label>
            <div class="email-check">
            	<input type="text" id="email-verifying-code" required placeholder="인증코드 6자리">
                <button type="button" id="checkMailBtn">인증 확인</button>
            </div>
            <div id="emailCheckFeedback" class="feedback"></div>
        </div>

        <button type="submit" id="submitBtn"
                class="submit-btn" disabled>가입하기</button>
    </form>
</div>

<script>
	window.onload = function() {
	    // 기존 URL 파라미터 에러 처리
	    const urlParams = new URLSearchParams(window.location.search);
	    if (urlParams.get('error') === 'true') {
	        switch (urlParams.get('reason')) {
	            case 'unique':
	                alert("이미 가입된 아이디입니다.");
	                break;
	            case 'unknown':
	                alert("알 수 없는 오류입니다.");
	                break;
	        }
	    }

	    // 요소들 가져오기
	    const apiUsernameExistsUrl = '<c:url value="/username-exists"/>';
	    const apiEmailExistsUrl   = '<c:url value="/email-exists"/>';
	    const sendMailUrl         = '<c:url value="/mail-send"/>';
	    const checkMailUrl        = '<c:url value="/mail-check"/>';
	    const usernameInput       = document.getElementById('username');
	    const checkUsernameBtn    = document.getElementById('checkUsernameBtn');
	    const usernameFeedback    = document.getElementById('usernameFeedback');
	    const pwdInput            = document.getElementById('password');
	    const pwdConfirmInput     = document.getElementById('passwordConfirm');
	    const passwordFeedback    = document.getElementById('passwordFeedback');
	    const nameInput           = document.getElementById('name');
	    const nameFeedback        = document.getElementById('nameFeedback');
	    const phoneInput          = document.getElementById('phone');
	    const phoneFeedback       = document.getElementById('phoneFeedback');
	    const emailInput          = document.getElementById('email');
	    const sendMailBtn         = document.getElementById('sendMailBtn');
	    const emailFeedback       = document.getElementById('emailFeedback');
	    const emailVerifyingCodeInput = document.getElementById('email-verifying-code');
	    const checkMailBtn        = document.getElementById('checkMailBtn');
	    const emailCheckFeedback  = document.getElementById('emailCheckFeedback');
	    const submitBtn           = document.getElementById('submitBtn');
	
	    let usernameValid = false;
	    let passwordMatch = false;
	    let nameValid = false;
	    let phoneValid = false;
	    let emailAvailable = false;
	    let emailVerified = false;

	    // CSRF 토큰 가져오기
	    const csrfParameterName = "${_csrf.parameterName}";
	    const csrfToken = "${_csrf.token}";

	    // 초기 UI 상태: 인증번호 받기 & 코드확인 비활성
	    sendMailBtn.disabled             = true;
	    emailVerifyingCodeInput.disabled = true;
	    checkMailBtn.disabled            = true;

	    // 이메일 수정 시 → 중복확인·인증 모두 리셋
	    emailInput.addEventListener('input', () => {
	        emailAvailable = false;
	        emailVerified  = false;
	        emailFeedback.textContent        = '';
	        emailCheckFeedback.textContent   = '';
	        sendMailBtn.disabled             = true;
	        emailVerifyingCodeInput.disabled = true;
	        emailVerifyingCodeInput.value    = '';
	        checkMailBtn.disabled            = true;
	        toggleSubmit();
	    });
	    
	    // 아이디 중복 검사
	    checkUsernameBtn.addEventListener('click', function() {
	        const username = usernameInput.value.trim();
	        if (!username) {
	            usernameValid = false;
	            usernameFeedback.textContent = '아이디를 입력해주세요.';
	            usernameFeedback.className = 'feedback invalid';
	            toggleSubmit();
	            return;
	        }
	        fetch(apiUsernameExistsUrl + '?username=' +
	              encodeURIComponent(username))
	            .then(res => res.json())
	            .then(data => {
	                if (data.exists) {
	                    usernameValid = false;
	                    usernameFeedback.textContent = '이미 사용중인 아이디입니다.';
	                    usernameFeedback.className = 'feedback invalid';
	                } else {
	                    usernameValid = true;
	                    usernameFeedback.textContent = '사용 가능한 아이디입니다.';
	                    usernameFeedback.className = 'feedback valid';
	                }
	                toggleSubmit();
	            })
	            .catch(err => {
	                console.error('Username check error:', err);
	            });
    	});

	    // 비밀번호 일치 검사
	    function checkPasswordMatch() {
	        const pwd    = pwdInput.value;
	        const confirm= pwdConfirmInput.value;
	        if (pwd && confirm && pwd === confirm) {
	            passwordMatch = true;
	            passwordFeedback.textContent = "비밀번호가 일치합니다.";
	            passwordFeedback.className = "feedback valid";
	        } else if (pwd && confirm) {
	            passwordMatch = false;
	            passwordFeedback.textContent = "비밀번호가 일치하지 않습니다.";
	            passwordFeedback.className = "feedback invalid";
	        } else {
	            passwordMatch = false;
	            passwordFeedback.textContent = "";
	        }
	        toggleSubmit();
	    }
	    pwdInput.addEventListener('keyup', checkPasswordMatch);
	    pwdConfirmInput.addEventListener('keyup', checkPasswordMatch);

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
	
	    // ——— 이메일 중복확인 버튼 ———
	    checkEmailBtn.addEventListener('click', function() {
	        const email = emailInput.value.trim();
	        if (!email) {
	            emailAvailable = false;
	            emailFeedback.textContent  = '이메일을 입력해주세요.';
	            emailFeedback.className    = 'feedback invalid';
	            sendMailBtn.disabled       = true;
	            toggleSubmit();
	            return;
	        }
	        fetch(apiEmailExistsUrl + '?email=' + encodeURIComponent(email))
	            .then(res => res.json())
	            .then(data => {
	                if (data.exists) {
	                    emailAvailable = false;
	                    emailFeedback.textContent  = '이미 사용 중인 이메일입니다.';
	                    emailFeedback.className    = 'feedback invalid';
	                    sendMailBtn.disabled       = true;
	                } else {
	                    emailAvailable = true;
	                    emailFeedback.textContent  = '사용 가능한 이메일입니다.';
	                    emailFeedback.className    = 'feedback valid';
	                    sendMailBtn.disabled       = false;
	                }
	                toggleSubmit();
	            })
	            .catch(err => {
	                console.error(err);
	                emailAvailable = false;
	                emailFeedback.textContent  = '중복 확인 중 오류가 발생했습니다.';
	                emailFeedback.className    = 'feedback invalid';
	                sendMailBtn.disabled       = true;
	                toggleSubmit();
	            });
	    });
	
	    // 이메일 전송 버튼 클릭 이벤트
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
	        formData.append(csrfParameterName, csrfToken); // CSRF 토큰 추가
	
	        fetch(sendMailUrl, {
	            method: 'POST',
	            headers: {
	                'Content-Type': 'application/x-www-form-urlencoded',
	            },
	            body: formData.toString()
	        })
	        .then(response => response.json())
	        .then(data => {
	            alert(data.message);
	            if (data.success) {
	                emailFeedback.textContent = '인증 메일이 전송되었습니다. 5분 이내에 코드를 입력해주세요.';
	                emailFeedback.className = 'feedback valid';
	                emailVerifyingCodeInput.disabled = false;
	                checkMailBtn.disabled            = false;
	                emailVerified = false; // 인증 메일 재전송 시 인증 상태 초기화
	                toggleSubmit();
	            } else {
	                emailFeedback.textContent = data.message;
	                emailFeedback.className = 'feedback invalid';
	            }
	        })
	        .catch(error => {
	            console.error('Email send error:', error);
	            alert('인증 메일 전송 중 오류가 발생했습니다.');
	            emailFeedback.textContent = '인증 메일 전송 중 오류가 발생했습니다.';
	            emailFeedback.className = 'feedback invalid';
	        });
	    });
	
	    // 이메일 인증 코드 확인 버튼 클릭 이벤트
	    checkMailBtn.addEventListener('click', function() {
	        const code = emailVerifyingCodeInput.value.trim();
	        if (!code) {
	            emailCheckFeedback.textContent = '인증 코드를 입력해주세요.';
	            emailCheckFeedback.className = 'feedback invalid';
	            return;
	        }
	
	        const formData = new URLSearchParams();
	        formData.append('code', code);
	        formData.append(csrfParameterName, csrfToken); // CSRF 토큰 추가
	
	        fetch(checkMailUrl, {
	            method: 'POST',
	            headers: {
	                'Content-Type': 'application/x-www-form-urlencoded',
	            },
	            body: formData.toString()
	        })
	        .then(response => response.json())
	        .then(data => {
	            alert(data.message);
	            if (data.success) {
	                emailVerified = true;
	                sendMailBtn.disabled = true;
	                emailVerifyingCodeInput.disabled = true;
	                checkMailBtn.disabled = true;
	                emailFeedback.textContent = '';
	                emailCheckFeedback.textContent = '이메일 인증이 완료되었습니다.';
	                emailCheckFeedback.className = 'feedback valid';
	            } else {
	                emailVerified = false;
	                emailCheckFeedback.textContent = data.message;
	                emailCheckFeedback.className = 'feedback invalid';
	            }
	            toggleSubmit();
	        })
	        .catch(error => {
	            console.error('Email verification error:', error);
	            alert('인증 코드 확인 중 오류가 발생했습니다.');
	            emailCheckFeedback.textContent = '인증 코드 확인 중 오류가 발생했습니다.';
	            emailCheckFeedback.className = 'feedback invalid';
	        });
	    });
	
	    // 제출 버튼 활성화 제어
	    function toggleSubmit() {
	        submitBtn.disabled = !(usernameValid && passwordMatch && nameValid && phoneValid && emailAvailable && emailVerified);
	    }
	
	    // 최종 폼 제출 전 검사
	    window.validateForm = function() {
	        if (!usernameValid) {
	            alert('아이디 중복 확인을 해주세요.');
	            return false;
	        }
	        if (!passwordMatch) {
	            alert('비밀번호를 확인해주세요.');
	            return false;
	        }
	        if (!nameValid) {
	        	alert('이름을 확인해주세요.');
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
	
	    // 폼 제출
	    const form = document.getElementById('signupForm');
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
