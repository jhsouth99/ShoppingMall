# 온라인 쇼핑몰 프로젝트

## Spring 프로젝트

#### Intellij 또는 STS 3 사용
#### 프론트엔드 - JSP
#### 백엔드 - Spring MVC (레거시 프로젝트)

참고사항: src/main/resources/application.properties 추가

## node.js 프로젝트

### 프론트엔드
cd client

npm install axios react-router-dom

### 백엔드
cd ../server

npm init -y

npm install express cors dotenv sequelize mysql2 jsonwebtoken bcrypt

#### (선택) 개발 편의: 서버 자동 재시작
npm install --save-dev nodemon
