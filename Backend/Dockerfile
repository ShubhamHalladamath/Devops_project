# ==============================================
# Build Stage: Compile and Package the JAR
# ==============================================
FROM maven:3.8.8-eclipse-temurin-17-alpine AS build

WORKDIR /app

# Cache Maven dependencies by copying only the pom.xml first
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source and package compiled artifact skipping test suites
COPY src ./src
RUN mvn package -DskipTests -B

# ==============================================
# Run Stage: Run the packaged JAR securely
# ==============================================
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Create a non-root system user and group to execute the app securely
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy built artifact from compiling phase
COPY --from=build /app/target/*.jar app.jar

# Adjust ownership of the working folder to user
RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
