# 영상 ID 생성기 (Video ID Builder)

프로모션/기획/자체제작 영상 ID를 클릭·스크롤만으로 만들고, 클립보드에 바로 복사하는 데스크톱 앱입니다.

```
[유형]-[제품]-[연도][회차]-[원고번호]-[인트로버전]-[카피여부]-[배너여부]-[비율]
예) P-A-26R02-S03-I01-C1-B0-916
```

## 기능

- 영상유형 / 제품: 버튼 선택. **"+" 버튼으로 새 유형·제품을 직접 추가**할 수 있어 나중에 종류가 늘어나도 코드 수정 없이 바로 대응됩니다 (추가한 항목은 자동 저장, × 눌러서 삭제도 가능)
- **제품은 "라인 코드 + 번호"** 방식으로 관리됩니다 (예: 리프팅라인의 주름크림=L1, 주름젤=L2). 같은 라인 제품은 화면에서 라인 이름표 아래 자동으로 묶여서 보이고, 알파벳 26개를 넘어서도 계속 늘릴 수 있습니다.
- 연도 / 회차 / 원고번호 / 인트로버전: 스크롤 또는 +/− 버튼으로 숫자 조정
- 상단카피 / 배너: 켜고 끄는 토글
- 비율: 9:16 / 16:9 / 1:1 버튼 선택
- 값을 바꿀 때마다 상단 미리보기가 즉시 갱신
- "ID 복사" 버튼으로 클립보드에 바로 복사
- **영상 파일을 앱 창에 드래그하면, ffmpeg가 내장되어 있어서 터미널 없이 바로 파일에 ID가 기록됩니다** (파일명은 그대로 유지, mp4/mov/m4v/mkv/webm 지원). 클릭해서 파일 선택도 가능합니다. 같은 파일에 다시 기록하면 이전 값을 완전히 덮어씁니다.
- **"다른 파일의 ID 확인하기"** 버튼으로, 이미 태깅된 영상 파일에 어떤 ID가 들어있는지 앱에서 바로 조회할 수 있습니다.
- ffmpeg 명령어를 직접 보고 싶다면 "ffmpeg 명령어 보기" 버튼으로 확인 가능 (참고용, 필수 아님)
- 마지막으로 입력한 값은 자동 저장되어 다음 실행 시 그대로 불러옵니다.

## 태그가 잘 기록됐는지 앱 밖에서 확인하는 법

- **Windows**: 파일 우클릭 → 속성 → 자세히 탭 → "설명"의 코멘트(Comments) 필드
- **Mac/공통**: VLC → 도구 → 코덱 정보 → 메타데이터 탭 (또는 QuickTime 영화 정보)
- 앱 안에서 바로 확인하고 싶으면 위의 "다른 파일의 ID 확인하기" 버튼을 쓰세요.

## GitHub으로 Windows exe 만들기

이 폴더 전체를 GitHub 저장소에 올리면, GitHub Actions가 자동으로 Windows exe를 빌드해줍니다. 로컬에 Windows나 Electron 개발 환경이 없어도 됩니다.

### 처음 설정 (한 번만)

1. GitHub에서 새 저장소를 만듭니다 (Private로 만들어도 됩니다).
2. 이 폴더 전체(`main.js`, `preload.js`, `index.html`, `renderer.js`, `package.json`, `.github/` 포함)를 그 저장소에 푸시합니다.

```bash
git init
git add .
git commit -m "영상 ID 생성기 초기 커밋"
git branch -M main
git remote add origin https://github.com/{계정명}/{저장소명}.git
git push -u origin main
```

3. 푸시가 끝나면 GitHub 저장소 페이지 상단의 **Actions** 탭으로 들어갑니다.
4. "Build Windows EXE" 워크플로우가 자동으로 실행되는 게 보입니다 (몇 분 정도 걸립니다).
5. 완료되면 그 실행 결과 페이지 하단 **Artifacts** 항목에 `VideoIDBuilder-windows`가 생기고, 클릭하면 zip으로 다운로드됩니다. 압축을 풀면 `.exe` 파일이 들어있습니다.

### 이후 업데이트할 때

코드를 수정한 뒤 다시 `git push`만 하면 Actions가 다시 자동으로 새 exe를 만들어줍니다.

### 정식 버전(릴리즈)으로 남기고 싶다면

태그를 붙여서 푸시하면, Actions 탭이 아니라 저장소의 **Releases** 페이지에도 exe가 정식으로 올라갑니다.

```bash
git tag v1.0.0
git push origin v1.0.0
```

## 로컬에서 바로 실행해보고 싶다면 (선택)

Windows/Mac 컴퓨터에 Node.js가 설치되어 있다면, GitHub 없이도 바로 실행해볼 수 있습니다.

```bash
npm install
npm start
```

## 파일 구성

```
video-id-builder/
├── main.js              # Electron 진입점 (창 생성 + ffmpeg 메타데이터 기록 처리)
├── preload.js            # 클립보드 복사 / 파일 태깅을 안전하게 연결
├── index.html             # 화면 UI
├── renderer.js            # 버튼/스크롤/미리보기/저장 로직
├── package.json           # 빌드 설정
└── .github/workflows/build.yml   # GitHub Actions 자동 빌드
```
