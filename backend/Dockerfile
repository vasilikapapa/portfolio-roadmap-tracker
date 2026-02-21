# ---- Build stage ----
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app

# ---- Run stage ----
FROM eclipse-temurin:21-jre
WORKDIR /app

COPY target/*.jar app.jar

# Render sets PORT; Spring must listen on it
ENV PORT=8080
EXPOSE 8080

CMD ["sh", "-c", "java -Dserver.port=$PORT -jar app.jar"]
