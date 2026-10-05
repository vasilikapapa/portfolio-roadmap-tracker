# ---- Build stage ----
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Download dependencies first so they are cached between builds
COPY pom.xml .
RUN mvn -B -q dependency:go-offline

# Then copy sources and build the jar
COPY src ./src
RUN mvn -B -DskipTests clean package

# ---- Run stage ----
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Render sets PORT
ENV PORT=8080
EXPOSE 8080

# JVM tuned for small free-tier containers (512 MB) and faster startup:
# - SerialGC + MaxRAMPercentage: stay inside the memory limit
# - TieredStopAtLevel=1: quicker JIT warm-up, which shortens cold starts
ENV JAVA_TOOL_OPTIONS="-XX:+UseSerialGC -XX:MaxRAMPercentage=75 -XX:TieredStopAtLevel=1 -Xss512k"

CMD ["sh", "-c", "java -Dserver.port=$PORT -jar app.jar"]
