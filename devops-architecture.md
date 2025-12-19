# DevOps Architecture Diagram

```mermaid
graph TB
    subgraph "Developer Workspace"
        DEV[Developer] -->|Commits Code| GIT[Git Repository]
    end
    
    subgraph "CI/CD Pipeline - Jenkins"
        GIT -->|Webhook Trigger| JENKINS[Jenkins Pipeline]
        JENKINS -->|Stage 1| CHECKOUT[Code Checkout]
        CHECKOUT -->|Stage 2| SONAR[SonarQube Analysis<br/>Code Quality Check]
        SONAR -->|Stage 3| BUILD[Docker Build<br/>node:20-alpine]
        BUILD -->|Stage 4| LOGIN[Docker Hub Login]
        LOGIN -->|Stage 5| PUSH[Docker Push<br/>isnowman/stickly-app]
        PUSH -->|Stage 6| K8S_DEPLOY[Kubernetes Deploy<br/>kubectl set image]
    end
    
    subgraph "Container Registry"
        PUSH -->|Store Image| DOCKERHUB[Docker Hub<br/>isnowman/stickly-app:BUILD_NUMBER]
    end
    
    subgraph "Kubernetes Cluster"
        K8S_DEPLOY -->|Update Deployment| DEPLOYMENT[Deployment<br/>stickly-deployment<br/>namespace: stickly]
        DEPLOYMENT -->|Manages| POD1[Pod: stickly<br/>Port 3000]
        DEPLOYMENT -->|Manages| POD2[Pod: stickly<br/>Port 3000]
        POD1 -->|Exposed via| SERVICE[Service<br/>stickly-service<br/>NodePort: 30080]
        POD2 -->|Exposed via| SERVICE
    end
    
    subgraph "Monitoring Stack"
        POD1 -->|Exports /metrics| PROM[Prometheus<br/>Port 30002<br/>Scrape Interval: 15s]
        POD2 -->|Exports /metrics| PROM
        PROM -->|Visualize| GRAFANA[Grafana Dashboard<br/>Port 32000]
    end
    
    subgraph "Quality Assurance"
        SONARQUBE[SonarQube Server<br/>Port 9000]
        SONAR -.->|Reports to| SONARQUBE
    end
    
    subgraph "External Access"
        USERS[End Users] -->|HTTP Request| SERVICE
        ADMIN[Admin] -->|Manage| JENKINS
        ADMIN -->|Monitor| GRAFANA
        ADMIN -->|Code Quality| SONARQUBE
    end
    
    style JENKINS fill:#D24939,color:#fff
    style SONAR fill:#4E9BCD,color:#fff
    style BUILD fill:#0DB7ED,color:#fff
    style DOCKERHUB fill:#0DB7ED,color:#fff
    style DEPLOYMENT fill:#326CE5,color:#fff
    style SERVICE fill:#326CE5,color:#fff
    style POD1 fill:#326CE5,color:#fff
    style POD2 fill:#326CE5,color:#fff
    style PROM fill:#E6522C,color:#fff
    style GRAFANA fill:#F46800,color:#fff
    style SONARQUBE fill:#4E9BCD,color:#fff
```

## Pipeline Stages

1. **Checkout**: Fetch latest code from Git repository
2. **SonarQube Analysis**: Run code quality and security analysis
3. **Docker Build**: Build container image using node:20-alpine
4. **Docker Login**: Authenticate with Docker Hub
5. **Docker Push**: Push image to registry with build number tag
6. **Kubernetes Deploy**: Update deployment and rollout to cluster

## Key Components

- **Jenkins**: CI/CD orchestration (Port 8080)
- **SonarQube**: Code quality analysis (Port 9000)
- **Docker Hub**: Container registry (isnowman/stickly-app)
- **Kubernetes**: Container orchestration
- **Prometheus**: Metrics collection (Port 30002)
- **Grafana**: Metrics visualization (Port 32000)

## Ports Summary

- Application: 30080 (NodePort)
- Jenkins: 8080
- SonarQube: 9000
- Prometheus: 30002
- Grafana: 32000
