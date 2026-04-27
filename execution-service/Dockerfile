# ── Build stage ──────────────────────────────────────────────────────────────
# Use full JDK for compilation (includes javac and tools.jar for Compiler API)
FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN apk add --no-cache maven && mvn clean package -DskipTests -q

# ── Runtime stage ─────────────────────────────────────────────────────────────
# Must use JDK (not JRE) so the Java Compiler API is available for compiling user code.
# The Docker daemon socket is mounted at runtime (not baked into image).
FROM eclipse-temurin:17-jdk-alpine
WORKDIR /app

# Install Docker CLI so this container can spawn Docker containers for code execution.
# The Docker daemon itself runs on the HOST — we just need the client binary here.
# Mount /var/run/docker.sock from the host when running this container.
RUN apk add --no-cache docker-cli

COPY --from=build /app/target/execution-service-*.jar app.jar

# Run as non-root, but needs access to docker group for socket
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
# docker group GID 999 is typical on Linux hosts — adjust if needed
RUN addgroup -g 999 docker 2>/dev/null || true
RUN adduser appuser docker 2>/dev/null || true
USER appuser

EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
