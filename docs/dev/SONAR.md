# SonarCloud + Cursor setup (MVP-2)

Project: [KarmaCummunity_MVP-2](https://sonarcloud.io/project/overview?id=KarmaCummunity_MVP-2)  
Organization: `karmacummunity`

## 1. Connect SonarQube for IDE in Cursor

1. Install extension **SonarQube for IDE** (SonarSource) if missing.
2. Open Command Palette → **SonarQube: Connect to SonarCloud**.
3. Sign in with GitHub → pick organization **KarmaCummunity** → bind project **MVP-2**.
4. Open this repo root (`MVP-2/`, not only `app/`).

After binding, the **SonarQube** panel shows server issues for open files and synced rules.

## 2. User token (optional — local scanner / API)

1. SonarCloud → **My Account** → **Security** → Generate Token.
2. In shell (do not commit):

   ```bash
   export SONAR_TOKEN="<your-token>"
   ```

3. Local scan from repo root:

   ```bash
   sonar-scanner \
     -Dsonar.host.url=https://sonarcloud.io \
     -Dsonar.token="$SONAR_TOKEN"
   ```

Uses `sonar-project.properties` at repo root.

## 3. Ask Claude to fix Sonar issues

Paste a SonarCloud filter URL or run:

```bash
curl -s "https://sonarcloud.io/api/issues/search?componentKeys=KarmaCummunity_MVP-2&resolved=false&impactSoftwareQualities=SECURITY,RELIABILITY&ps=50" | jq '.issues[] | {file:.component, line, rule, message}'
```

Priority order: **Security** → **Reliability (BUG)** → **BLOCKER/CRITICAL** → maintainability (large backlog; tackle incrementally).

## 4. CI

SonarCloud **Automatic Analysis** is enabled for this repo on `main`. For PR decoration, add the official SonarCloud GitHub Action (see SonarCloud → Administration → Analysis Method).
