# Budget Tracker – React CI/CD with Jenkins

A small React budget tracker (income/expenses, balance, per-category totals, over-budget warning; data kept in browser `localStorage`) used to demonstrate CI/CD with **GitHub, Jenkins, SonarQube and Docker**.

Core logic lives in [src/budget.js](src/budget.js) and is covered by unit tests in [src/budget.test.js](src/budget.test.js); UI behaviour is tested in [src/App.test.jsx](src/App.test.jsx).

## Run locally
```bash
npm ci
npm run dev        # http://localhost:5173
npm test           # unit tests
npm run coverage   # tests + coverage/lcov.info
npm run build      # production build in dist/
```

## Repository layout
| File | Purpose |
|---|---|
| `Jenkinsfile` | CI pipeline (Multibranch) |
| `Jenkinsfile.cd` | Parameterized CD pipeline |
| `Dockerfile` | nginx image serving `dist/` |
| `sonar-project.properties` | SonarQube config (imports `coverage/lcov.info`) |

## Branches and CI behaviour
| Stage | feature/* | develop | main |
|---|---|---|---|
| Checkout, Install and Test, Coverage | yes | yes | yes |
| SonarQube Analysis, Quality Gate | | | yes |
| Build | | yes | yes |
| Archive Artifact (`react-app-<BUILD_NUMBER>.tar.gz`) | | | yes |

A failing test stops the pipeline. On `main`, a failed quality gate (coverage < 80%) aborts before Build/Archive.

## Jenkins setup
1. **Plugins:** Pipeline, Multibranch/GitHub Branch Source, NodeJS, SonarQube Scanner, Copy Artifact.
2. **Tools** (Manage Jenkins > Tools): NodeJS 24 installation named `node24` (vitest 5 / vite 8 / jsdom 31 need a recent Node); SonarQube Scanner named `SonarScanner`.
3. **System:** SonarQube server named `SonarQube` (URL + token stored as a Jenkins *secret text* credential). Add a SonarQube webhook `http://<jenkins>/sonarqube-webhook/` so `waitForQualityGate` returns.
4. **Docker:** the Jenkins agent must be able to run `docker` (e.g. mount `/var/run/docker.sock`, install the docker CLI).
5. **CI job:** New Item > *Multibranch Pipeline* named **`budget-tracker-ci`**, source GitHub (this repo), script path `Jenkinsfile`. Enable a GitHub webhook (`/github-webhook/`) or periodic scan for automatic triggering.
6. **CD job:** New Item > *Pipeline* named `budget-tracker-cd`, "Pipeline script from SCM", script path `Jenkinsfile.cd`.

## SonarQube
- Create project `budget-tracker`, generate a token, and create a quality gate with **Coverage on overall code >= 80%**; assign it to the project.
- Only `main` is analysed (Community Build has no branch analysis).

## Versioned artifact
`main` builds produce `react-app-<BUILD_NUMBER>.tar.gz` containing `dist/` and the `Dockerfile` (no `node_modules`), archived on the job.

## CD (deploy a chosen CI build)
Run `budget-tracker-cd` with parameters:
- `CI_BUILD_NUMBER` – build number of `budget-tracker-ci/main`
- `ENVIRONMENT` – DEV, TEST, ACC or PROD (PROD asks for manual approval)

It copies the artifact, extracts it, builds an image from its Dockerfile (no `npm run build`), and starts a container:

| Env | Container | URL |
|---|---|---|
| DEV | budget-tracker-dev | http://localhost:8081 |
| TEST | budget-tracker-test | http://localhost:8082 |
| ACC | budget-tracker-acc | http://localhost:8083 |
| PROD | budget-tracker-prod | http://localhost:8084 |

## Dependency security (`npm audit`)
Result at time of writing: **0 vulnerabilities**.
Initially `npm audit` reported 10 findings (e.g. critical *tinypool* prototype pollution, moderate *esbuild* dev-server request issue) all pulled in transitively by the test/build tooling (`vitest@2`, `vite@5`). Remediation was to upgrade to the patched major versions (`vitest@5`, `vite@8`, `@vitest/coverage-v8@5`) and re-run `npm audit`.

## Failure and recovery demonstration
Demonstrated on `feature/add-validation` (failed test).

| Build | Commit | Result |
|---|---|---|
| #6 | "Treat spending equal to the limit as over budget" | **FAILED** at *Install and Test*; Coverage, SonarQube, Quality Gate, Build and Archive were skipped |
| #7 | "Fix off-by-one: spending equal to the limit is not over budget" | **SUCCESS**, 20/20 tests pass |

**Cause.** In `src/budget.js`, `isOverBudget` was changed from `expenses > limit` to `expenses >= limit`. An off-by-one error like this flags a budget that has been spent *exactly* as over budget. The boundary test `isOverBudget > is false when expenses equal the limit (boundary)` failed with `AssertionError: expected true to be false`, and Jenkins stopped the pipeline at the test stage.

**Correction.** Restore the strict comparison (`>`), so only spending above the limit counts as over budget. The unchanged test passes and the pipeline runs through to the end for this branch.

**Why it matters.** The boundary test, not just line coverage, caught a real defect that coverage alone would have missed (the faulty line was still executed by the tests).

## Notes
Coverage does not guarantee defect-free software; tests assert concrete values and error messages rather than only executing code.
