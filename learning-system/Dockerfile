# ----------- Stage 1: Build -----------
FROM maven:3.9.9-eclipse-temurin-17 AS builder

WORKDIR /app

# Copy only pom first (better caching)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source
COPY src ./src

# Build jar
RUN mvn clean package -DskipTests

# ----------- Stage 2: Run -----------
FROM eclipse-temurin:17-jdk-alpine

WORKDIR /app

# Copy jar from builder
COPY --from=builder /app/target/devlearner.jar app.jar

# Expose port
EXPOSE 8080

# JVM optimizations (important for containers)
ENTRYPOINT ["java", "-jar", "app.jar"]