Portfolio Roadmap Tracker – Backend

Production-ready Spring Boot backend for managing portfolio projects, tasks, and progress updates.
Built with clean architecture, JWT security, Flyway migrations, and Docker deployment.

Tech Stack

Java 21 · Spring Boot 3
Spring Security + JWT (HS256)
Spring Data JPA · PostgreSQL
Flyway · Docker
Render (deployment)

Features

Public API
List projects
View project details (tasks + updates)
Admin API (JWT)
Create / update / delete tasks
Create / delete updates
Stateless auth, BCrypt passwords
Flyway-managed schema
Health check endpoint

Run Locally
Database (Docker)
docker run --name portfolio_pg \
-e POSTGRES_USER=portfolio \
-e POSTGRES_PASSWORD=portfolio \
-e POSTGRES_DB=portfolio_tracker \
-p 5432:5432 \
-d postgres:16

App
./mvnw spring-boot:run

Environment Variables

SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/portfolio_tracker
SPRING_DATASOURCE_USERNAME=portfolio
SPRING_DATASOURCE_PASSWORD=portfolio

APP_ADMIN_USER=admin
APP_ADMIN_PASS_HASH=$2a$10$...
APP_JWT_SECRET=32+char-secret
PORT=8081

Authentication
POST /auth/login
{ "username": "admin", "password": "super-long-32-characters-minimum-secret-key-123456" }


Use:
Authorization: Bearer <token>

API Docs
Swagger UI:
/swagger-ui.html

Health Check
GET /health

Deployment
Dockerized and deployed on Render with PostgreSQL and environment-based configuration.
