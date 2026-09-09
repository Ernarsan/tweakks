# 📱 Руководство: Бесплатная сборка iOS `.ipa` через GitHub Actions (Без платного аккаунта Apple)

Этот документ содержит полное описание методологии, архитектуры и готовых решений для сборки iOS-приложений (`.ipa`) на облачных раннерах **GitHub Actions**.

Метод позволяет получать полноценный `.ipa` файл для установки на iPhone через утилиты сайдлоадинга (**Sideloadly**, **AltStore**, **TrollStore**, **Scarlet**), не имея платной подписки Apple Developer Program ($99/год).

---

## 🎯 В чем главная проблема стандартной сборки iOS?

1. **Apple Developer Program ($99/год)**: При обычной сборке через Xcode или `eas build` Apple требует действующий сертификат разработчика и Provisioning Profile.
2. **Xcode 16 / Xcode 26 и CocoaPods**: При попытке собрать проект с флагом `CODE_SIGNING_ALLOWED=NO` Xcode все равно выдает фатальную ошибку:
   ```text
   error: Signing for "TaskGoalsApp" requires a development team.
   error: "TaskGoalsApp" requires a provisioning profile.
   ```
3. **`xcodebuild -exportArchive` не работает без сертификатов**: Стандартная команда экспорта архива в `.ipa` жестко валидирует цифровую подпись и завершается сбоем, если подпись отсутствует.

---

## 💡 Суть нашего метода

1. **Бесплатный macOS-раннер GitHub Actions**: Используем `macos-15` (виртуальная машина Apple Silicon на базе Mac M-серии), доступная бесплатно для публичных репозиториев.
2. **Автоматический патчинг проекта перед компиляцией**:
   - Отключаем требование подписи в `Podfile` для всех зависимостей CocoaPods.
   - Модифицируем файл проекта `project.pbxproj`, переводя `CODE_SIGN_STYLE` в `Manual`, отключая `CODE_SIGNING_ALLOWED` и очищая `DevelopmentTeam`.
3. **Автоматическое устранение несовместимостей Swift 6 / Xcode 26**:
   - Патчим специфичные ошибки строгой типизации Swift (`weak let` → `nonisolated(unsafe) weak var`, конструкторы C++ `SWIFT_RETURNS_RETAINED`).
4. **Сборка архива `xcodebuild archive`**: Собираем сырой `.xcarchive` под реальную архитектуру iPhone (`generic/platform=iOS`, ARM64).
5. **Ручная упаковка в IPA**: Копируем полученный `.app` в папку `Payload` и сжимаем в `.ipa` (стандартный формат iOS).
6. **Автоматический релиз на GitHub**: Загружаем `.ipa` в артефакты сборки и создаем GitHub Release с прямой ссылкой на скачивание.

---

## 🛠️ Полная структура GitHub Actions Workflow

Файл размещается по пути: `.github/workflows/build-ipa.yml`

```yaml
name: Build iOS IPA

on:
  workflow_dispatch: # Возможность запустить вручную кнопкой в GitHub
  push:
    branches: [ main, master ] # Автозапуск при пуше в main/master

permissions:
  contents: write # Требуется для создания GitHub Releases и загрузки файлов

jobs:
  build-ipa:
    runs-on: macos-15 # Рекомендуется macos-15 (быстрые Apple Silicon раннеры)
    steps:
      - name: ⬇️ Checkout repository
        uses: actions/checkout@v4

      - name: 🟢 Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: 📦 Install npm dependencies
        run: npm install --legacy-peer-deps

      - name: 📱 Select Xcode
        run: |
          # Ищем самую актуальную версию Xcode (Xcode 26 или Xcode 16)
          for xcode in /Applications/Xcode_26*.app /Applications/Xcode*.app; do
            if [ -d "$xcode" ]; then
              echo "Selecting $xcode"
              sudo xcode-select -s "$xcode/Contents/Developer"
              break
            fi
          done
          xcodebuild -version
          swift -version

      - name: 🛠️ Ensure Swift compatibility for Expo Modules
        run: |
          node -e "
          const fs = require('fs');
          const path = require('path');

          // 1. Патч 'weak let' -> 'nonisolated(unsafe) weak var' (требование Swift 6.2+)
          function patchWeakLet(dir) {
            if (!fs.existsSync(dir)) return;
            for (const f of fs.readdirSync(dir)) {
              const full = path.join(dir, f);
              if (fs.statSync(full).isDirectory()) {
                if (f !== '.git') patchWeakLet(full);
              } else if (f.endsWith('.swift')) {
                let c = fs.readFileSync(full, 'utf8');
                if (c.includes('weak let') || c.includes('weak var runtime')) {
                  c = c.replace(/nonisolated\(unsafe\)\s+weak\s+let/g, 'nonisolated(unsafe) weak var');
                  c = c.replace(/weak\s+let/g, 'nonisolated(unsafe) weak var');
                  c = c.replace(/(?<!nonisolated\(unsafe\)\s+)weak\s+var\s+runtime/g, 'nonisolated(unsafe) weak var runtime');
                  c = c.replace(/nonisolated\(unsafe\)\s+nonisolated\(unsafe\)/g, 'nonisolated(unsafe)');
                  fs.writeFileSync(full, c);
                }
              }
            }
          }
          patchWeakLet('node_modules');

          // 2. Удаление SWIFT_RETURNS_RETAINED из C++ конструкторов
          const rsPath = 'node_modules/expo-modules-jsi/apple/Sources/ExpoModulesJSI-Cxx/include/RuntimeScheduler.h';
          if (fs.existsSync(rsPath)) {
            let rs = fs.readFileSync(rsPath, 'utf8');
            rs = rs.replace(/SWIFT_RETURNS_RETAINED\s+/g, '');
            fs.writeFileSync(rsPath, rs);
          }

          // 3. Безопасный проброс указателей через Sendable-обертку NonisolatedUnsafeVar
          const jsRuntimePath = 'node_modules/expo-modules-jsi/apple/Sources/ExpoModulesJSI/Runtime/JavaScriptRuntime.swift';
          if (fs.existsSync(jsRuntimePath)) {
            let jr = fs.readFileSync(jsRuntimePath, 'utf8');
            jr = jr.replace(/nonisolated\(unsafe\) let thisPtr = thisPtr\s+nonisolated\(unsafe\) let argumentsPtr = argumentsPtr\s+nonisolated\(unsafe\) let resultPtr = resultPtr/g,
              'let safeThis = NonisolatedUnsafeVar(thisPtr)\n    let safeArgs = NonisolatedUnsafeVar(argumentsPtr)\n    nonisolated(unsafe) let resultPtr = resultPtr'
            );
            jr = jr.replace(/UnsafeMutablePointer\(mutating: thisPtr\)\.move\(\)/g,
              'UnsafeMutablePointer(mutating: safeThis.value!).move()'
            );
            jr = jr.replace(/JavaScriptValuesBuffer\(runtime, start: argumentsPtr, count: argumentsCount\)/g,
              'JavaScriptValuesBuffer(runtime, start: safeArgs.value, count: argumentsCount)'
            );
            jr = jr.replace(/JavaScriptUnownedValue\(runtime\.pointee, thisPtr\)/g,
              'JavaScriptUnownedValue(runtime.pointee, safeThis.value)'
            );
            fs.writeFileSync(jsRuntimePath, jr);
          }
          console.log('✅ Swift compatibility patches applied');
          "

      - name: 📱 Prebuild iOS project
        run: |
          npx expo prebuild --platform ios --clean --no-install
          echo "export NODE_BINARY=$(which node)" > ios/.xcode.env.local

      - name: 🔧 Patch Podfile and Project for Unsigned Build
        run: |
          node -e "
          const fs = require('fs');

          // А. Отключаем подпись для всех Pods библиотек
          let podfile = fs.readFileSync('ios/Podfile', 'utf8');
          const hook = \`
              installer.pods_project.targets.each do |target|
                target.build_configurations.each do |config|
                  config.build_settings['CODE_SIGNING_ALLOWED'] = 'NO'
                  config.build_settings['CODE_SIGNING_REQUIRED'] = 'NO'
                  config.build_settings['CODE_SIGN_IDENTITY'] = ''
                  config.build_settings['EXPANDED_CODE_SIGN_IDENTITY'] = ''
                end
              end
          \`;
          if (podfile.includes('post_install do |installer|')) {
            podfile = podfile.replace(/post_install do \|installer\|/, 'post_install do |installer|' + hook);
          } else {
            podfile += '\npost_install do |installer|\n' + hook + '\nend\n';
          }
          fs.writeFileSync('ios/Podfile', podfile);
          console.log('✅ Podfile patched');

          // Б. Отключаем требование команды разработки в основном проекте
          const pbxPath = fs.readdirSync('ios').find(f => f.endsWith('.xcodeproj'));
          const pbxFile = 'ios/' + pbxPath + '/project.pbxproj';
          let pbx = fs.readFileSync(pbxFile, 'utf8');
          pbx = pbx.replace(/CODE_SIGN_STYLE = Automatic;/g, 'CODE_SIGN_STYLE = Manual;');
          pbx = pbx.replace(/ProvisioningStyle = Automatic;/g, 'ProvisioningStyle = Manual;');
          pbx = pbx.replace(/CODE_SIGNING_ALLOWED = YES;/g, 'CODE_SIGNING_ALLOWED = NO;');
          pbx = pbx.replace(/DevelopmentTeam = [^;]+;/g, 'DevelopmentTeam = \"\";');
          pbx = pbx.replace(/buildSettings = \{/g, 'buildSettings = {\n\t\t\t\tCODE_SIGNING_ALLOWED = NO;\n\t\t\t\tCODE_SIGNING_REQUIRED = NO;\n\t\t\t\tCODE_SIGN_IDENTITY = \"\";');
          fs.writeFileSync(pbxFile, pbx);
          console.log('✅ project.pbxproj patched');
          "

      - name: 🍫 Install CocoaPods dependencies
        run: |
          cd ios
          pod install --repo-update
          cd ..

      - name: ⚙️ Build Archive via Xcode (Real iPhone ARM64)
        run: |
          mkdir -p build
          set -o pipefail
          SCHEME=$(ls ios | grep .xcworkspace | sed 's/.xcworkspace//')
          xcodebuild archive \
            -workspace "ios/${SCHEME}.xcworkspace" \
            -scheme "$SCHEME" \
            -archivePath "build/${SCHEME}.xcarchive" \
            -configuration Release \
            -destination 'generic/platform=iOS' \
            CODE_SIGN_STYLE=Manual \
            CODE_SIGNING_ALLOWED=NO \
            CODE_SIGNING_REQUIRED=NO \
            CODE_SIGN_IDENTITY="" \
            EXPANDED_CODE_SIGN_IDENTITY="" \
            DEVELOPMENT_TEAM="" \
            PROVISIONING_PROFILE_SPECIFIER="" 2>&1 | tee xcode_build.log || {
              echo "### ❌ Xcode Build Error Log" >> $GITHUB_STEP_SUMMARY
              echo '```text' >> $GITHUB_STEP_SUMMARY
              tail -n 120 xcode_build.log >> $GITHUB_STEP_SUMMARY
              echo '```' >> $GITHUB_STEP_SUMMARY
              exit 1
            }

      - name: 📦 Package into TaskGoalsApp.ipa
        run: |
          mkdir -p build/Payload
          APP_PATH=$(find build/*.xcarchive/Products/Applications -name "*.app" -type d | head -n 1)
          echo "Found .app at: $APP_PATH"
          if [ -z "$APP_PATH" ]; then
            echo "Error: .app not found in archive!"
            exit 1
          fi
          cp -r "$APP_PATH" build/Payload/
          cd build
          zip -r TaskGoalsApp.ipa Payload
          cd ..
          echo "### 🎉 IPA Successfully Built" >> $GITHUB_STEP_SUMMARY
          ls -lh build/TaskGoalsApp.ipa

      - name: 🚀 Upload TaskGoalsApp.ipa artifact
        uses: actions/upload-artifact@v4
        with:
          name: TaskGoalsApp-ipa
          path: build/TaskGoalsApp.ipa
          retention-days: 14

      - name: 🌟 Create GitHub Release with IPA
        uses: softprops/action-gh-release@v2
        if: startsWith(github.ref, 'refs/tags/') || github.event_name == 'workflow_dispatch' || github.ref == 'refs/heads/main'
        with:
          tag_name: v1.0.${{ github.run_number }}
          name: "TaskGoalsApp v1.0.${{ github.run_number }}"
          body: "Готовый к установке iOS IPA файл приложения, собранный через GitHub Actions без платного аккаунта Apple."
          files: build/TaskGoalsApp.ipa
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: 📝 Upload build log on failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: xcode-error-log
          path: xcode_build.log
```

---

## 🔍 Подробный разбор критических моментов

### 1. Как обойти проверку Provisioning Profile в Xcode
Если в `project.pbxproj` остается `ProvisioningStyle = Automatic;` или `CODE_SIGN_STYLE = Automatic;`, Xcode еще до начала компиляции останавливает процесс с ошибкой:
> *"Signing requires a development team"*.

**Решение**:
Патч в воркфлоу на лету заменяет:
- `Automatic` на `Manual`
- `DevelopmentTeam = <TEAM_ID>;` на `DevelopmentTeam = "";`
- Внедряет в каждый блок `buildSettings` параметры:
  ```text
  CODE_SIGNING_ALLOWED = NO;
  CODE_SIGNING_REQUIRED = NO;
  CODE_SIGN_IDENTITY = "";
  ```

### 2. Почему нельзя использовать `xcodebuild -exportArchive`
Стандартный шаг Apple:
`xcodebuild -exportArchive -archivePath ... -exportPath ... -exportOptionsPlist ...`
Этот шаг требует валидного профиля дистрибьюции и сертификата `Apple Distribution`. Если их нет, шаг выдает `IDEDistributionErrorDomain error 1`.

**Решение**:
Мы собираем архив `xcodebuild archive`, внутри которого формируется скомпилированный бинарник `.app` (`build/<App>.xcarchive/Products/Applications/<App>.app`).
Формат `.ipa` — это обычный zip-архив с папкой `Payload/<App>.app`.
Мы делаем:
```bash
mkdir -p build/Payload
cp -r build/*.xcarchive/Products/Applications/*.app build/Payload/
cd build && zip -r App.ipa Payload
```
Получается 100% валидный `.ipa`, совместимый с любым инструментом сайдлоадинга.

### 3. Ошибки Swift 6.2 и Xcode 26
В последних версиях Xcode (16.2+ / 26) компилятор Swift перешел на строгую модель проверки многопоточности (Strict Concurrency):
- **`'weak' must be a mutable variable`**: переменные `weak let` теперь запрещены языком Swift. Их нужно заменять на `weak var`.
- **`stored property of 'Sendable'-conforming class is mutable`**: если сделать `weak var`, компилятор ругается, что класс `Sendable` содержит мутабельное свойство. Решение: `nonisolated(unsafe) weak var`.
- **`'RuntimeScheduler' cannot be annotated with SWIFT_RETURNS_RETAINED`**: конструкторы C++ нельзя помечать как возвращающие значение, так как в C++ у конструкторов нет типа возврата. Решение: удаление этого макроса из конструкторов.
- **`sending 'thisPtr' risks causing data races`**: передача сырых C++ указателей в изолированный контекст `@JavaScriptActor`. Решение: упаковка указателей в `NonisolatedUnsafeVar(...)`.

---

## 📲 Как устанавливать полученный `.ipa` на iPhone

| Метод | Нужен ПК? | Срок действия | Описание |
| :--- | :---: | :---: | :--- |
| **Sideloadly** | Да (Win/Mac) | 7 дней (авто-обновление по Wi-Fi) | Самый стабильный способ. Подписывает вашим бесплатным Apple ID. |
| **AltStore** | Да (Win/Mac) | 7 дней | Популярный сайдлоадер с фоновым обновлением сертификатов. |
| **TrollStore** | Нет | Бессрочно | Для поддерживаемых версий iOS (работает через баг CoreTrust, сертификаты не нужны). |
| **Scarlet / ESign** | Нет | До отзыва сертификата | Установка прямо из Safari по бесплатному корпоративному сертификату. |

### Инструкция для Sideloadly (Бесплатно, 2 минуты):
1. Скачайте [Sideloadly](https://sideloadly.io/) (доступен для Windows и Mac).
2. Подключите iPhone по USB-кабелю к компьютеру.
3. Скачайте `.ipa` из вкладки **Releases** вашего GitHub-репозитория.
4. Перетащите файл `.ipa` в окно Sideloadly.
5. В поле `Apple ID` укажите ваш личный Apple ID (пароль запрашивается для генерации бесплатного сертификата разработчика Apple).
6. Нажмите кнопку **Start**.
7. На iPhone зайдите в **Настройки → Основные → VPN и управление устройством** → нажмите на ваш Apple ID → выберите **«Доверять»**.
8. Приложение готово к запуску!

---

## 📋 Чек-лист для применения на новом проекте

1. В `app.json` / `package.json` задайте уникальный `bundleIdentifier` (например, `com.yourname.appname`).
2. В репозитории GitHub перейдите в **Settings → Actions → General → Workflow permissions** и выберите **«Read and write permissions»** (чтобы workflow мог публиковать релизы).
3. Скопируйте файл `.github/workflows/build-ipa.yml` в ваш репозиторий.
4. Сделайте `git push origin main`.
5. Во вкладке **Actions** на GitHub отслеживайте процесс сборки (~4-7 минут).
6. Заберите готовый файл во вкладке **Releases**!
