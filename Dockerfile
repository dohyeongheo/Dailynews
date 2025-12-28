# Next.js 개발 환경을 위한 Dockerfile
FROM node:20-alpine

# Dev Containers를 위해 bash와 git 설치
RUN apk add --no-cache bash git

# 작업 디렉토리 설정
WORKDIR /app

# 의존성 파일 복사
COPY package.json package-lock.json* ./

# 의존성 설치
RUN npm ci

# 소스 코드 복사
COPY . .

# 개발 서버 포트 노출
EXPOSE 3000

# 개발 서버 실행
CMD ["npm", "run", "dev"]

