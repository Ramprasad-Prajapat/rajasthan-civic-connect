# Build stage
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY settings-docker.xml .
COPY pom.xml .
COPY src ./src
RUN mvn -B -ntp -s settings-docker.xml -Dmaven.wagon.http.retryHandler.count=5 -Daether.connector.http.retryHandler.count=5 -DskipTests package

# Runtime stage
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=65 -XX:+UseSerialGC -XX:TieredStopAtLevel=1 -Xss512k"
ENTRYPOINT ["java", "-jar", "app.jar"]
